import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { FeeType, PaymentStatus } from '@prisma/client';

// Helper to reliably get centerId
async function getAuthenticatedCenterId() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CENTER') {
    return null;
  }

  if (user.centerId) {
    return user.centerId;
  }

  const centerRecord = await db.center.findUnique({
    where: { userId: user.userId },
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
        feePlan: {
          include: {
            installments: true,
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

    return NextResponse.json({ center, students });
  } catch (error) {
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
      totalAmount,
      downPayment,
      installmentCount,
    } = body;

    if (!fullName || !email || !password || !studentCode || !courseId || totalAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check duplicate email
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Check duplicate studentCode
    const existingStudent = await db.student.findUnique({ where: { studentCode } });
    if (existingStudent) {
      return NextResponse.json({ error: 'Student code already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTotalAmount = Number(totalAmount) || 0;
    const initialPaid = Number(downPayment) || 0;
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

    // Create User, Student, FeePlan, and Installments
    const newStudentUser = await db.$transaction(async (tx) => {
      const userRecord = await tx.user.create({
        data: {
          email,
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
            },
          },
        },
        include: {
          student: true,
        },
      });

      const studentId = userRecord.student!.id;

      // Create Fee Plan matching your schema
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

      // Generate Installments if remaining amount exists
      if (isEMI) {
        const installmentAmount = remainingBalance / numInstallments;
        for (let i = 1; i <= numInstallments; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);

          await tx.installment.create({
            data: {
              feePlanId: createdFeePlan.id,
              amount: installmentAmount,
              dueDate,
              status: PaymentStatus.PENDING,
            },
          });
        }
      }

      return userRecord;
    });

    return NextResponse.json({
      message: 'Student admitted successfully',
      student: newStudentUser.student,
    });
  } catch (error) {
    console.error('Admission API error:', error);
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}