import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentReceiptEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { feePlanId, amount, mode, installmentId } = await req.json();

    if (!feePlanId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid feePlanId and payment amount are required.' },
        { status: 400 }
      );
    }

    const payAmount = Number(amount);

    // 1. Fetch current fee plan details with student info
    const feePlan = await prisma.feePlan.findUnique({
      where: { id: feePlanId },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
      },
    });

    if (!feePlan) {
      return NextResponse.json({ error: 'Fee plan not found.' }, { status: 404 });
    }

    if (payAmount > feePlan.balance) {
      return NextResponse.json(
        { error: `Amount cannot exceed current outstanding balance of ₹${feePlan.balance}` },
        { status: 400 }
      );
    }

    // 2. Generate unique Receipt Number (e.g., REC-2026-1049)
    const receiptCount = await prisma.payment.count();
    const currentYear = new Date().getFullYear();
    const receiptNo = `REC-${currentYear}-${(receiptCount + 1).toString().padStart(4, '0')}`;

    // 3. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Payment entry
      const payment = await tx.payment.create({
        data: {
          feePlanId,
          amount: payAmount,
          mode: mode || 'CASH',
          receiptNo,
        },
      });

      const updatedPaidAmount = feePlan.paidAmount + payAmount;
      const updatedBalance = feePlan.totalAmount - updatedPaidAmount;
      const newStatus = updatedBalance === 0 ? 'PAID' : 'PARTIAL';

      // Update FeePlan balance & status
      await tx.feePlan.update({
        where: { id: feePlanId },
        data: {
          paidAmount: updatedPaidAmount,
          balance: updatedBalance,
          status: newStatus,
        },
      });

      // Agar installment specific pay kiya gaya hai toh use update karein
      if (installmentId) {
        await tx.installment.update({
          where: { id: installmentId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      return { payment, updatedBalance };
    });

    // 4. Send Confirmation Email asynchronously
    if (feePlan.student?.user?.email) {
      try {
        await sendPaymentReceiptEmail({
          toEmail: feePlan.student.user.email,
          studentName: feePlan.student.fullName,
          amountReceived: payAmount,
          outstandingBalance: result.updatedBalance,
          receiptNumber: receiptNo,
          paymentMode: mode || 'CASH',
        });
      } catch (mailErr) {
        console.error('Receipt Email dispatch failed:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded and balance reconciled successfully.',
      receiptNo,
      balance: result.updatedBalance,
    });
  } catch (error: unknown) {
    console.error('Fee Payment Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Payment processing failed.',
      },
      { status: 500 }
    );
  }
}