import { NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmiReminderEmail } from '@/lib/mail';

export async function GET(req: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Target windows: 1 day, 2 days, 7 days from now
    const targetDays = [1, 2, 7];
    const alertsDispatched: {
      student: string;
      email: string;
      daysRemaining: number;
      amount: number;
    }[] = [];

    for (const days of targetDays) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);

      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      // Find unpaid installments due on this target date
      const dueInstallments = await prisma.installment.findMany({
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
          dueDate: {
            gte: targetDate,
            lt: nextDay,
          },
        },
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
      });

      for (const inst of dueInstallments) {
        const student = inst.feePlan?.student;
        const studentEmail = student?.user?.email;

        if (studentEmail && student?.fullName) {
          try {
            await sendEmiReminderEmail({
              toEmail: studentEmail,
              studentName: student.fullName,
              installmentAmount: inst.amount,
              dueDate: inst.dueDate.toISOString().split('T')[0],
              daysRemaining: days,
            });

            alertsDispatched.push({
              student: student.fullName,
              email: studentEmail,
              daysRemaining: days,
              amount: inst.amount,
            });
          } catch (mailErr) {
            console.error(`Failed to dispatch alert to ${studentEmail}:`, mailErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `EMI Reminders processed. Dispatched ${alertsDispatched.length} alert notices.`,
      dispatchedCount: alertsDispatched.length,
      alertsDispatched,
    });
  } catch (error: unknown) {
    console.error('EMI Reminder Cron Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute EMI reminders.',
      },
      { status: 500 }
    );
  }
}