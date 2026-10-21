import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'STUDENT') {
      const feePlan = await db.feePlan.findUnique({
        where: { studentId: user.studentId ?? '' },
        include: {
          student: {
            include: {
              course: true,
              center: true,
            },
          },
          installments: true,
          payments: true,
        },
      });

      return NextResponse.json({ feePlan });
    }

    const feePlans = await db.feePlan.findMany({
      include: {
        student: {
          include: {
            course: true,
            center: true,
          },
        },
        installments: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ feePlans });
  } catch (error) {
    console.error('Fetch fees error:', error);
    return NextResponse.json({ error: 'Failed to fetch fee plans' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'CENTER') {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, amount, mode = 'CASH' } = body ?? {};

    if (!studentId || !amount) {
      return NextResponse.json({ error: 'studentId and amount are required' }, { status: 400 });
    }

    const feePlan = await db.feePlan.findUnique({
      where: { studentId },
      include: { installments: true },
    });

    if (!feePlan) {
      return NextResponse.json({ error: 'Fee plan not found for this student' }, { status: 404 });
    }

    const paymentAmount = Number(amount);
    const updatedPaidAmount = Math.min(feePlan.totalAmount, feePlan.paidAmount + paymentAmount);
    const updatedBalance = Math.max(0, feePlan.totalAmount - updatedPaidAmount);

    const nextStatus = updatedPaidAmount >= feePlan.totalAmount ? 'PAID' : updatedPaidAmount > 0 ? 'PARTIAL' : 'PENDING';

    const [updatedFeePlan, payment] = await db.$transaction([
      db.feePlan.update({
        where: { id: feePlan.id },
        data: {
          paidAmount: updatedPaidAmount,
          balance: updatedBalance,
          status: nextStatus,
        },
      }),
      db.payment.create({
        data: {
          feePlanId: feePlan.id,
          amount: paymentAmount,
          mode,
          paymentDate: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Payment recorded successfully',
      feePlan: updatedFeePlan,
      payment,
    });
  } catch (error) {
    console.error('Record fee payment error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
