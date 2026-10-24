import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { FeeType, PaymentStatus } from '@prisma/client';
import { sendPaymentReceiptEmail } from '@/lib/mail';

// Helper to reliably get centerId
async function getAuthenticatedCenterId() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userRole = (user as any)?.role;
  // Support both 'CENTER' and 'CENTER_ADMIN'
  if (userRole !== 'CENTER_ADMIN' && userRole !== 'CENTER') {
    return null;
  }

  if ((user as any)?.centerId) {
    return (user as any).centerId;
  }

  const userId = (user as any)?.userId || (user as any)?.id;
  const userEmail = (user as any)?.email;

  const centerRecord = await db.center.findFirst({
    where: {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(userId ? [{ id: userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    },
    select: { id: true },
  });

  return centerRecord?.id || null;
}

// 1. Get all students enrolled under this center
export async function GET() {
  try {
    const centerId = await getAuthenticatedCenterId();
    if (!centerId) {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const students = await db.student.findMany({
      where: { centerId },
      include: {
        user: { select: { email: true } },
        course: true,
        assignedTeacher: {
          select: { id: true, fullName: true, teacherCode: true },
        },
        feePlan: {
          include: {
            installments: {
              orderBy: { dueDate: 'asc' },
            },
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const center = await db.center.findUnique({
      where: { id: centerId },
      select: { name: true, centerCode: true },
    });

    return NextResponse.json({ success: true, center, students });
  } catch (error: unknown) {
    console.error('Fetch center students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// 2. Register/Admit new student under this center
export async function POST(req: Request) {
  try {
    const centerId = await getAuthenticatedCenterId();
    if (!centerId) {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      password,
      studentCode,
      phone,
      dob,
      gender,
      address,
      courseId,
      teacherId,
      totalAmount,
      downPayment,
      installmentCount,
      paymentMode = 'CASH',
    } = body;

    if (!fullName || !email || !password || !studentCode || !courseId || totalAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Check duplicate studentCode
    const existingStudent = await db.student.findUnique({ where: { studentCode } });
    if (existingStudent) {
      return NextResponse.json({ error: 'Student code already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTotalAmount = Math.max(0, Number(totalAmount) || 0);
    const initialPaid = Math.max(0, Number(downPayment) || 0);
    const remainingBalance = Math.max(0, parsedTotalAmount - initialPaid);
    const numInstallments = parseInt(installmentCount, 10) || 1;
    const isEMI = numInstallments > 1 && remainingBalance > 0;

    let feeStatus: PaymentStatus = PaymentStatus.PENDING;
    if (initialPaid >= parsedTotalAmount && parsedTotalAmount > 0) {
      feeStatus = PaymentStatus.PAID;
    } else if (initialPaid > 0) {
      feeStatus = PaymentStatus.PARTIAL;
    }

    const studentDob = dob ? new Date(dob) : new Date('2000-01-01');

    // Generate unique Receipt Number if down payment exists
    const currentYear = new Date().getFullYear();
    const paymentCount = await db.payment.count();
    const receiptNo = `REC-${currentYear}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    // Create User, Student, FeePlan, Down Payment & Installments in single transaction
    const result = await db.$transaction(async (tx) => {
      const userRecord = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: 'STUDENT',
          student: {
            create: {
              fullName,
              studentCode,
              phone: phone || '',
              dob: studentDob,
              gender: gender || 'Not Specified',
              address: address || '',
              centerId,
              courseId,
              teacherId: teacherId || null,
            },
          },
        },
        include: {
          student: true,
        },
      });

      const studentId = userRecord.student!.id;

      // 1. Create Fee Plan
      const createdFeePlan = await tx.feePlan.create({
        data: {
          studentId,
          type: isEMI ? FeeType.EMI : FeeType.ONE_TIME,
          totalAmount: parsedTotalAmount,
          paidAmount: initialPaid,
          balance: remainingBalance,
          status: feeStatus,
        },
      });

      // 2. If downPayment > 0, create explicit Payment transaction record
      let initialPaymentRecord = null;
      if (initialPaid > 0) {
        initialPaymentRecord = await tx.payment.create({
          data: {
            feePlanId: createdFeePlan.id,
            amount: initialPaid,
            mode: paymentMode,
            receiptNo,
          },
        });
      }

      // 3. Generate Installments if remaining balance exists
      if (isEMI) {
        const roundedInstallment = Math.round((remainingBalance / numInstallments) * 100) / 100;
        const baseDate = new Date();

        for (let i = 1; i <= numInstallments; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(baseDate.getMonth() + i);

          // Adjust last installment to prevent fractional roundoff difference
          const currentInstallmentAmount =
            i === numInstallments
              ? Math.round((remainingBalance - roundedInstallment * (numInstallments - 1)) * 100) / 100
              : roundedInstallment;

          await tx.installment.create({
            data: {
              feePlanId: createdFeePlan.id,
              amount: currentInstallmentAmount,
              dueDate,
              status: PaymentStatus.PENDING,
            },
          });
        }
      }

      return {
        userRecord,
        initialPaymentRecord,
      };
    });

    // 4. Send email receipt asynchronously if initial down payment was made
    if (initialPaid > 0) {
      sendPaymentReceiptEmail({
        toEmail: cleanEmail,
        studentName: fullName,
        amountReceived: initialPaid,
        outstandingBalance: remainingBalance,
        receiptNumber: receiptNo,
        paymentMode,
      }).catch((mailErr) => console.error('Admission receipt email dispatch failed:', mailErr));
    }

    return NextResponse.json({
      success: true,
      message: 'Student admitted and enrolled successfully',
      student: result.userRecord.student,
      receiptNo: initialPaid > 0 ? receiptNo : null,
    });
  } catch (error: unknown) {
    console.error('Admission API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to enroll student',
      },
      { status: 500 }
    );
  }
}