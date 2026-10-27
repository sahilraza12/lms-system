import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only' },
        { status: 401 }
      );
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;
    const currentStudentCode = (user as any)?.studentCode || (user as any)?.identifier;

    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
          ...(currentStudentCode ? [{ studentCode: currentStudentCode }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        center: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            phone: true,
            address: true,
          },
        },
        course: {
          include: {
            notes: {
              orderBy: { createdAt: 'desc' },
            },
            tasks: {
              orderBy: { dueDate: 'asc' },
              include: {
                submissions: true,
              },
            },
          },
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
        certificates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found for this account' },
        { status: 404 }
      );
    }

    // Sirf wahi tasks jisme student ki submission filtered ho
    const courseTasks = (student.course?.tasks || []).map((task) => ({
      ...task,
      submissions: task.submissions.filter((sub) => sub.studentId === student.id),
    }));

    // Pure dynamic course data (Database me notes honge to aayenge, nahi to empty array [])
    const dynamicCourse = student.course
      ? {
          ...student.course,
          notes: student.course.notes || [],
          tasks: courseTasks,
        }
      : null;

    // Academic progress telemetry
    const totalTasks = courseTasks.length;
    const completedTasks = courseTasks.filter((t) =>
      t.submissions.some((s) => s.status === 'SUBMITTED' || s.status === 'REVIEWED')
    ).length;

    const curriculumProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Financial fee summary
    const feePlan = student.feePlan;
    const totalAmount = Number(feePlan?.totalAmount || student.course?.totalFee || 0);
    const paidAmount = Number(feePlan?.paidAmount || 0);
    const balance = Number(feePlan?.balance || Math.max(0, totalAmount - paidAmount));

    const normalizedStudent = {
      ...student,
      progress: curriculumProgress,
      course: dynamicCourse,
      feePlan: feePlan
        ? {
            ...feePlan,
            totalAmount,
            paidAmount,
            balance,
            payments: (feePlan.payments || []).map((p) => ({
              ...p,
              amount: Number(p.amount),
              receiptUrl: `/receipt/${p.receiptNo || p.id}?from=student`,
            })),
            installments: (feePlan.installments || []).map((i) => ({
              ...i,
              amount: Number(i.amount),
            })),
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      student: normalizedStudent,
      billingSummary: {
        totalAmount,
        paidAmount,
        balance,
        status: feePlan?.status || (balance === 0 && totalAmount > 0 ? 'PAID' : 'PENDING'),
        progress: curriculumProgress,
      },
    });
  } catch (error: unknown) {
    console.error('Fetch student profile error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch student profile',
      },
      { status: 500 }
    );
  }
}