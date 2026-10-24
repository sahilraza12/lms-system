import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendEmiReminderEmail } from '@/lib/mail';

// Helper: Safely find center without passing invalid fields
async function getCenterContext(user: any) {
  const currentUserId = user?.id || user?.userId;
  const currentUserEmail = user?.email;

  if (user?.centerId) {
    return { id: user.centerId, name: 'Khanna Branch' };
  }

  const center = await db.center.findFirst({
    where: {
      OR: [
        ...(currentUserId ? [{ id: currentUserId }, { userId: currentUserId }] : []),
        ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
      ],
    },
    select: { id: true, name: true },
  });

  return center;
}

// 1. GET: Preview upcoming dues
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const center = await getCenterContext(user);

    const now = new Date();
    const upcomingWindow = new Date();
    upcomingWindow.setDate(now.getDate() + 7);

    const pendingInstallments = await db.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: upcomingWindow,
        },
        ...(center?.id
          ? {
              feePlan: {
                student: {
                  centerId: center.id,
                },
              },
            }
          : {}),
      },
      include: {
        feePlan: {
          include: {
            student: {
              include: {
                user: { select: { email: true } },
                course: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formattedList = pendingInstallments.map((inst) => {
      const student = inst.feePlan?.student;
      const dueDateObj = new Date(inst.dueDate);
      const diffTime = dueDateObj.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      return {
        installmentId: inst.id,
        studentId: student?.id,
        studentName: student?.fullName,
        studentCode: student?.studentCode,
        studentEmail: student?.user?.email,
        courseTitle: student?.course?.title,
        amountDue: Number(inst.amount),
        dueDate: dueDateObj.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        daysRemaining,
        remainingBalance: Number(inst.feePlan?.balance || inst.amount),
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedList.length,
      upcomingDues: formattedList,
    });
  } catch (error: unknown) {
    console.error('Fetch upcoming dues error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch upcoming EMI dues.' },
      { status: 500 }
    );
  }
}

// 2. POST: Dispatch EMI Notifications (Single ya Bulk dono support karta hai)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Center access required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { studentId, installmentId } = body;

    const center = await getCenterContext(user);

    const now = new Date();
    const upcomingWindow = new Date();
    upcomingWindow.setDate(now.getDate() + 7);

    // Target filters setup
    const targetFilter: any = {
      status: 'PENDING',
      feePlan: {
        balance: { gt: 0 },
        ...(center?.id ? { student: { centerId: center.id } } : {}),
        ...(studentId ? { student: { id: studentId } } : {}),
      },
      ...(installmentId ? { id: installmentId } : {}),
      ...(!studentId && !installmentId ? { dueDate: { lte: upcomingWindow } } : {}),
    };

    const pendingInstallments = await db.installment.findMany({
      where: targetFilter,
      include: {
        feePlan: {
          include: {
            student: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (pendingInstallments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending EMI found for notification.',
        dispatchedCount: 0,
      });
    }

    let dispatchedCount = 0;
    const handledStudentIds = new Set<string>();
    const failureList: string[] = [];

    for (const inst of pendingInstallments) {
      const student = inst.feePlan?.student;
      const studentEmail = student?.user?.email;

      // Duplicate mail na jaye ek batch me
      if (student && studentEmail && !handledStudentIds.has(student.id)) {
        handledStudentIds.add(student.id);

        const dueDateObj = new Date(inst.dueDate);
        const diffTime = dueDateObj.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        try {
          await sendEmiReminderEmail({
            toEmail: studentEmail,
            studentName: student.fullName,
            installmentAmount: Number(inst.amount),
            dueDate: dueDateObj.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            daysRemaining,
            remainingBalance: Number(inst.feePlan?.balance || inst.amount),
            instituteName: center?.name || 'VIQ Technologies',
          });
          dispatchedCount++;
        } catch (mailErr) {
          console.error(`Failed to dispatch reminder to ${studentEmail}:`, mailErr);
          failureList.push(studentEmail);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: studentId
        ? 'Individual reminder dispatched successfully!'
        : `Dispatched ${dispatchedCount} EMI reminder notification(s).`,
      dispatchedCount,
      failures: failureList,
    });
  } catch (error: unknown) {
    console.error('Dispatch EMI reminders error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to dispatch EMI alerts.' },
      { status: 500 }
    );
  }
}