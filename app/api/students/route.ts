import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper: Safely resolve centerId with strict fallbacks
async function resolveCenterId(user: any, fallbackId?: string | null) {
  if (fallbackId && fallbackId !== 'default-center-id' && fallbackId.trim() !== '') {
    return fallbackId;
  }

  if (user?.centerId) return user.centerId;

  const currentUserId = user?.id || user?.userId;
  const currentUserEmail = user?.email;

  if (currentUserId || currentUserEmail) {
    const centerRecord = await db.center.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ id: currentUserId }] : []),
          ...(currentUserId ? [{ userId: currentUserId }] : []),
          ...(currentUserEmail ? [{ email: currentUserEmail }] : []),
        ],
      },
      select: { id: true },
    });
    if (centerRecord?.id) return centerRecord.id;
  }

  const fallbackCenter = await db.center.findFirst({ select: { id: true } });
  return fallbackCenter?.id || null;
}

// 1. Fetch Students, Mentors & Courses for this Branch
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const queryCenterId = searchParams.get('centerId');

    const centerId = await resolveCenterId(user, queryCenterId);

    if (!centerId) {
      return NextResponse.json({
        success: true,
        centerId: null,
        students: [],
        teachers: [],
        courses: [],
      });
    }

    const [studentRecords, teachers, courseRecords] = await Promise.all([
      db.student.findMany({
        where: { centerId },
        include: {
          user: { select: { email: true } },
          course: { select: { id: true, title: true, totalFee: true } },
          teacher: { select: { id: true, fullName: true, teacherCode: true } },
          feePlan: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
              paidAmount: true,
              balance: true,
              status: true,
              payments: {
                orderBy: { paymentDate: 'desc' },
                take: 1,
                select: { receiptNo: true, id: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.teacher.findMany({
        where: { centerId },
        select: { id: true, fullName: true, teacherCode: true, specialization: true },
        orderBy: { fullName: 'asc' },
      }),
      db.course.findMany({
        select: { id: true, title: true, totalFee: true, courseCode: true },
        orderBy: { title: 'asc' },
      }),
    ]);

    const students = studentRecords.map(({ course, teacher, ...student }) => ({
      ...student,
      assignedTeacher: teacher,
      course: course ? { ...course, price: Number(course.totalFee) } : null,
      feePlan: student.feePlan
        ? {
            ...student.feePlan,
            totalAmount: Number(student.feePlan.totalAmount),
            paidAmount: Number(student.feePlan.paidAmount),
            balance: Number(student.feePlan.balance),
            latestReceiptNo: student.feePlan.payments?.[0]?.receiptNo || null,
          }
        : null,
    }));

    const courses = courseRecords.map((course) => ({
      ...course,
      price: Number(course.totalFee),
    }));

    return NextResponse.json({
      success: true,
      centerId,
      students,
      teachers,
      courses,
    });
  } catch (error: unknown) {
    console.error('Fetch Center Students Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate directory.' },
      { status: 500 }
    );
  }
}

// 2. Enroll New Student & Configure Billing Plan + Generate Compliant Receipt
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const {
      fullName,
      studentCode,
      email,
      phone,
      password,
      courseId,
      teacherId,
      feeType,
      totalAmount,
      initialPayment,
      installmentCount,
    } = body;

    const centerId = await resolveCenterId(user, body.centerId);

    if (!fullName || !studentCode || !email || !password || !courseId || !centerId) {
      return NextResponse.json(
        { error: 'Name, roll code, email, password, course, and center are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentCode = studentCode.trim().toUpperCase();

    // Check duplicate email
    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 });
    }

    // Check duplicate student code
    const existingCode = await db.student.findUnique({ where: { studentCode: cleanStudentCode } });
    if (existingCode) {
      return NextResponse.json({ error: 'Student Roll Code already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTotal = Math.max(0, Number(totalAmount) || 0);
    const parsedInitial = Math.max(0, Number(initialPayment) || 0);
    const remainingBalance = Math.max(0, parsedTotal - parsedInitial);

    // Generate Standard REC-YYYY-XXXX for advance payment if collected
    const currentYear = new Date().getFullYear();
    const paymentCount = await db.payment.count();
    const receiptNo = `REC-${currentYear}-${(paymentCount + 1).toString().padStart(4, '0')}`;
    const receiptUrl = `/receipt/${receiptNo}`;

    const result = await db.$transaction(async (tx) => {
      // 1. Create Base User
      const newUser = await tx.user.create({
        data: {
          name: fullName.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      // 2. Create Student Record
      const newStudent = await tx.student.create({
        data: {
          studentCode: cleanStudentCode,
          fullName: fullName.trim(),
          phone: phone?.trim() || '',
          dob: body.dob ? new Date(body.dob) : new Date('2000-01-01T00:00:00.000Z'),
          gender: body.gender || 'Not Specified',
          address: body.address || 'Address not provided',
          userId: newUser.id,
          centerId,
          courseId,
          teacherId: teacherId || null,
        },
      });

      // 3. Create Billing Fee Plan
      const newFeePlan = await tx.feePlan.create({
        data: {
          studentId: newStudent.id,
          type: feeType === 'EMI' ? 'EMI' : 'ONE_TIME',
          totalAmount: parsedTotal,
          paidAmount: parsedInitial,
          balance: remainingBalance,
          status: remainingBalance === 0 && parsedTotal > 0 ? 'PAID' : parsedInitial > 0 ? 'PARTIAL' : 'PENDING',
        },
      });

      let initialPaymentRecord = null;

      // 4. Record Initial Payment Receipt (Safe schema matching without transactionRef)
      if (parsedInitial > 0) {
        initialPaymentRecord = await tx.payment.create({
          data: {
            feePlanId: newFeePlan.id,
            amount: parsedInitial,
            mode: body.paymentMode || 'CASH',
            receiptNo,
            receiptUrl,
          },
        });
      }

      // 5. Generate EMI Installment Milestones
      if (feeType === 'EMI' && remainingBalance > 0) {
        const count = Math.max(1, Number(installmentCount) || 3);
        const perInstallment = Math.round(remainingBalance / count);

        const baseDate = new Date();
        for (let i = 1; i <= count; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(baseDate.getMonth() + i);

          await tx.installment.create({
            data: {
              feePlanId: newFeePlan.id,
              amount: i === count ? remainingBalance - perInstallment * (count - 1) : perInstallment,
              dueDate,
              status: 'PENDING',
            },
          });
        }
      }

      return {
        student: newStudent,
        user: newUser,
        feePlan: newFeePlan,
        payment: initialPaymentRecord,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate enrolled and billing plan initialized successfully.',
      student: result.student,
      receiptNo: result.payment?.receiptNo || null,
      receiptUrl: result.payment?.receiptUrl || null,
    });
  } catch (error: unknown) {
    console.error('Admission Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete admission process.' },
      { status: 500 }
    );
  }
}