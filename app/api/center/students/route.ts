import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { FeeType, PaymentStatus } from '@prisma/client';
import { sendPaymentReceiptEmail } from '@/lib/mail';

// Logged-in Center ID nikalne ke liye helper
async function getAuthenticatedCenterId() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userRole = (user as any)?.role;
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

// 1. GET: Center ke sabhi enrolled students fetch karna
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

// 2. POST: New student admission enroll karna (Bina Transaction Timeout Trap ke)
export async function POST(req: Request) {
  try {
    const centerId = await getAuthenticatedCenterId();
    if (!centerId) {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid admission payload' }, { status: 400 });
    }

    const {
      fullName,
      candidateName,
      name,
      email,
      password,
      phone,
      dob,
      gender,
      address,
      courseId: rawCourseId,
      course: rawCourseName,
      courseName,
      teacherId,
      instructorId,
      totalAmount,
      totalFee,
      downPayment,
      paidAmount,
      installmentCount,
      paymentMode = 'CASH',
    } = body;

    const studentFullName = (fullName || candidateName || name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const studentPassword = password || '12345678';

    if (!studentFullName || !cleanEmail) {
      return NextResponse.json({ error: 'Student full name and official email are required.' }, { status: 400 });
    }

    // Course ID resolve karna
    let resolvedCourseId = rawCourseId;
    if (!resolvedCourseId || resolvedCourseId === 'Select Course...') {
      const searchTitle = rawCourseName || courseName || 'AI & Machine Learning';
      const foundCourse = await db.course.findFirst({
        where: {
          OR: [
            { id: searchTitle },
            { title: { contains: searchTitle, mode: 'insensitive' } },
            { courseCode: { contains: searchTitle, mode: 'insensitive' } } as any,
          ],
        },
      });

      if (foundCourse) {
        resolvedCourseId = foundCourse.id;
      } else {
        const anyCourse = await db.course.findFirst();
        if (anyCourse) {
          resolvedCourseId = anyCourse.id;
        } else {
          const createdCourse = await db.course.create({
            data: {
              title: searchTitle,
              courseCode: 'COURSE-' + Math.floor(100 + Math.random() * 900),
              durationMonths: 6,
              fee: Number(totalAmount || totalFee || 25000),
            } as any,
          });
          resolvedCourseId = createdCourse.id;
        }
      }
    }

    // Check duplicate email
    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: `An account with email "${cleanEmail}" is already registered.` }, { status: 400 });
    }

    // Auto-generate student code/roll number agar form se na aaye
    let studentCode = body.studentCode?.trim();
    if (!studentCode) {
      const studentCount = await db.student.count();
      const centerData = await db.center.findUnique({
        where: { id: centerId },
        select: { centerCode: true },
      });
      const prefix = centerData?.centerCode || 'VIQ';
      studentCode = `${prefix}-STU-${(studentCount + 1).toString().padStart(4, '0')}`;
    }

    const hashedPassword = await bcrypt.hash(studentPassword, 10);
    const parsedTotalAmount = Math.max(0, Number(totalAmount ?? totalFee ?? 0));
    const initialPaid = Math.max(0, Number(downPayment ?? paidAmount ?? 0));
    const remainingBalance = Math.max(0, parsedTotalAmount - initialPaid);
    const numInstallments = parseInt(installmentCount, 10) || (remainingBalance > 0 ? 2 : 1);
    const isEMI = numInstallments > 1 && remainingBalance > 0;

    let feeStatus: PaymentStatus = PaymentStatus.PENDING;
    if (initialPaid >= parsedTotalAmount && parsedTotalAmount > 0) {
      feeStatus = PaymentStatus.PAID;
    } else if (initialPaid > 0) {
      feeStatus = PaymentStatus.PARTIAL;
    }

    const studentDob = dob ? new Date(dob) : new Date('2002-01-01');

    // Receipt number generate karna
    const currentYear = new Date().getFullYear();
    const paymentCount = await db.payment.count().catch(() => 0);
    const receiptNo = `REC-${currentYear}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    const assignedFacultyId = teacherId || instructorId || null;

    // 1. User + Student Record create karna (Sequential - no transaction timeout)
    const userRecord = await db.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            fullName: studentFullName,
            studentCode,
            phone: phone || '',
            dob: studentDob,
            gender: gender || 'Not Specified',
            address: address || '',
            centerId,
            courseId: resolvedCourseId,
            teacherId: assignedFacultyId && assignedFacultyId !== 'Select Instructor...' ? assignedFacultyId : null,
          },
        },
      },
      include: {
        student: true,
      },
    });

    const studentId = userRecord.student!.id;

    // 2. Fee Plan create karna
    const createdFeePlan = await db.feePlan.create({
      data: {
        studentId,
        type: isEMI ? FeeType.EMI : FeeType.ONE_TIME,
        totalAmount: parsedTotalAmount,
        paidAmount: initialPaid,
        balance: remainingBalance,
        status: feeStatus,
      },
    });

    // 3. Down payment record agar amount > 0
    if (initialPaid > 0) {
      await db.payment.create({
        data: {
          feePlanId: createdFeePlan.id,
          amount: initialPaid,
          mode: paymentMode,
          receiptNo,
        },
      });
    }

    // 4. Installments create karna
    if (isEMI) {
      const roundedInstallment = Math.round((remainingBalance / numInstallments) * 100) / 100;
      const baseDate = new Date();

      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + i);

        const currentInstallmentAmount =
          i === numInstallments
            ? Math.round((remainingBalance - roundedInstallment * (numInstallments - 1)) * 100) / 100
            : roundedInstallment;

        await db.installment.create({
          data: {
            feePlanId: createdFeePlan.id,
            amount: currentInstallmentAmount,
            dueDate,
            status: PaymentStatus.PENDING,
          },
        });
      }
    }

    // 5. Down payment hone par receipt email send karna
    if (initialPaid > 0) {
      sendPaymentReceiptEmail({
        toEmail: cleanEmail,
        studentName: studentFullName,
        amountReceived: initialPaid,
        outstandingBalance: remainingBalance,
        receiptNumber: receiptNo,
        paymentMode,
      }).catch((mailErr) => console.error('Admission receipt email dispatch failed:', mailErr));
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${studentFullName} successfully enrolled. Roll: ${studentCode}`,
      student: userRecord.student,
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