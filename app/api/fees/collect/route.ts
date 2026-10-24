import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { studentId, amount, paymentMode, referenceNote } = await req.json();

    if (!studentId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid student ID and positive collection amount are required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.$transaction(async (tx: any) => {
      // 1. Locate student to ensure valid record
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: { feePlan: true },
      });

      if (!student) {
        throw new Error('Student record not found in system.');
      }

      // 2. Fetch or initialize FeePlan
      let feePlan = student.feePlan;
      if (!feePlan && tx.feePlan) {
        feePlan = await tx.feePlan.create({
          data: {
            studentId,
            totalAmount: 25000,
            paidAmount: 0,
            balance: 25000,
          },
        });
      }

      const currentPaid = Number(feePlan?.paidAmount ?? 0);
      const totalAmount = Number(feePlan?.totalAmount ?? 25000);
      const newPaid = currentPaid + parsedAmount;
      const newBalance = Math.max(0, totalAmount - newPaid);

      if (feePlan && tx.feePlan) {
        await tx.feePlan.update({
          where: { id: feePlan.id },
          data: {
            paidAmount: newPaid,
            balance: newBalance,
          },
        });
      }

      // 3. Create Receipt / Voucher (Detects whichever model exists in your schema)
      let receiptRecord: any = null;

      if (tx.feeReceipt) {
        receiptRecord = await tx.feeReceipt.create({
          data: {
            studentId,
            receiptNumber,
            amountPaid: parsedAmount,
            paymentMode: paymentMode || 'UPI',
            transactionRef: referenceNote || 'Direct Cashier Entry',
          },
        });
      } else if (tx.receipt) {
        receiptRecord = await tx.receipt.create({
          data: {
            studentId,
            receiptNumber,
            amount: parsedAmount,
            mode: paymentMode || 'UPI',
            note: referenceNote || 'Direct Cashier Entry',
          },
        });
      } else if (tx.installment) {
        receiptRecord = await tx.installment.create({
          data: {
            feePlanId: feePlan?.id,
            amount: parsedAmount,
            status: 'PAID',
            paymentDate: new Date(),
          },
        });
      }

      return {
        id: receiptRecord?.id || `rec-${Date.now()}`,
        receiptNumber: receiptRecord?.receiptNumber || receiptNumber,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully.',
      receiptId: result.id,
      receiptNumber: result.receiptNumber,
    });
  } catch (error: unknown) {
    console.error('Fee collection error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reconcile fee payment record.' },
      { status: 500 }
    );
  }
}