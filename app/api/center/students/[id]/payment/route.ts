import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PaymentStatus } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'CENTER') {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const { id: studentId } = await params;
    const body = await req.json();
    const { amount, mode } = body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // 1. Fetch Student & FeePlan
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        feePlan: {
          include: {
            installments: {
              where: { status: 'PENDING' },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
    });

    if (!student || !student.feePlan) {
      return NextResponse.json({ error: 'Student fee plan not found' }, { status: 404 });
    }

    const feePlan = student.feePlan;
    const updatedPaid = feePlan.paidAmount + paymentAmount;
    const updatedBalance = Math.max(0, feePlan.totalAmount - updatedPaid);

    let newStatus: PaymentStatus = feePlan.status;
    if (updatedBalance <= 0) {
      newStatus = PaymentStatus.PAID;
    } else if (updatedPaid > 0) {
      newStatus = PaymentStatus.PARTIAL;
    }

    // 2. Transaction: Save Payment, Update FeePlan, Update Installments
    const result = await db.$transaction(async (tx) => {
      // Create Payment Entry
      const paymentRecord = await tx.payment.create({
        data: {
          feePlanId: feePlan.id,
          amount: paymentAmount,
          mode: mode || 'CASH',
        },
      });

      // Update FeePlan Totals
      await tx.feePlan.update({
        where: { id: feePlan.id },
        data: {
          paidAmount: updatedPaid,
          balance: updatedBalance,
          status: newStatus,
        },
      });

      // Clear installments sequentially against payment amount
      let remainingCredit = paymentAmount;
      for (const inst of feePlan.installments) {
        if (remainingCredit >= inst.amount) {
          await tx.installment.update({
            where: { id: inst.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt: new Date(),
            },
          });
          remainingCredit -= inst.amount;
        } else {
          break;
        }
      }

      return paymentRecord;
    });

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment: result,
      newBalance: updatedBalance,
    });
  } catch (error) {
    console.error('Payment record error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}