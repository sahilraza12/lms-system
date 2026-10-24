import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper: Safely resolve centerId from session
async function resolveCenterId(user: any, fallbackId?: string | null) {
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

  if (fallbackId && fallbackId !== 'default-center-id') {
    return fallbackId;
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
          assignedTeacher: { select: { id: true, fullName: true, teacherCode: true } },
          feePlan: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
              paidAmount: true,
              balance: true,
              status: true,
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

    const students = studentRecords.map(({ course, ...student }) => ({
      ...student,
      course: course ? { ...course, price: course.totalFee } : null,
    }));

    const courses = courseRecords.map((course) => ({
      ...course,
      price: course.totalFee,
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

// 2. Enroll New Student & Configure Billing Plan
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      fullName,
      studentCode,
      email,
      phone,
      password,
      courseId,
      teacherId,
      feeType, // 'ONE_TIME' | 'EMI'
      totalAmount,
      initialPayment,
      installmentCount,
    } = body;

    // Resolve centerId either from request body or logged-in user
    const centerId = body.centerId || (await resolveCenterId(user));

    if (!fullName || !studentCode || !email || !password || !courseId || !centerId) {
      return NextResponse.json(
        { error: 'Name, student code, email, password, course, and center are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 });
    }

    // Check duplicate student code
    const existingCode = await db.student.findUnique({ where: { studentCode: studentCode.trim().toUpperCase() } });
    if (existingCode) {
      return NextResponse.json({ error: 'Student Roll Code already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTotal = Math.max(0, Number(totalAmount) || 0);
    const parsedInitial = Math.max(0, Number(initialPayment) || 0);
    const remainingBalance = Math.max(0, parsedTotal - parsedInitial);

    const result = await db.$transaction(async (tx) => {
      // 1. Create User
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
          studentCode: studentCode.trim().toUpperCase(),
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
          status: remainingBalance === 0 ? 'PAID' : parsedInitial > 0 ? 'PARTIAL' : 'PENDING',
        },
      });

      // 4. Record Initial Receipt if advance payment was collected
      if (parsedInitial > 0) {
        await tx.payment.create({
          data: {
            feePlanId: newFeePlan.id,
            amount: parsedInitial,
            mode: body.paymentMode || 'CASH',
            receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
          },
        });
      }

      // 5. Generate EMI Installment milestones if EMI chosen
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

      return { student: newStudent, user: newUser, feePlan: newFeePlan };
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate enrolled and billing plan initialized.',
      student: result.student,
    });
  } catch (error: unknown) {
    console.error('Admission Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete admission process.' },
      { status: 500 }
    );
  }
}