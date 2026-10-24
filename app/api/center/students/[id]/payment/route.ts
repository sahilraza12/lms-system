import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendPaymentReceiptEmail } from '@/lib/mail';

// 1. GET: Fetch student fee breakdown, installments, and payment history
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const studentId = resolvedParams?.id;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required.' },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { email: true, name: true } },
        course: { select: { title: true, totalFee: true } },
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
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        email: student.user?.email,
        courseTitle: student.course?.title,
        feePlan: student.feePlan,
      },
    });
  } catch (error: unknown) {
    console.error('Fetch student payment details error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch student fee details.',
      },
      { status: 500 }
    );
  }
}

// 2. POST: Record an installment / EMI payment & issue bill
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Center or Admin credentials required.' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const studentId = resolvedParams?.id;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID parameter is missing.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      amount,
      paymentMode = 'CASH',
      installmentId,
      transactionRef = '',
    } = body;

    const installmentAmount = Math.max(0, Number(amount) || 0);
    if (installmentAmount <= 0) {
      return NextResponse.json(
        { error: 'Please enter a valid payment amount.' },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { email: true } },
        feePlan: {
          include: {
            installments: {
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
    });

    if (!student || !student.feePlan) {
      return NextResponse.json(
        { error: 'Active fee plan not found for this candidate.' },
        { status: 404 }
      );
    }

    const currentFeePlan = student.feePlan;
    const currentPaid = Number(currentFeePlan.paidAmount || 0);
    const totalAmount = Number(currentFeePlan.totalAmount || 0);
    const newPaidAmount = currentPaid + installmentAmount;
    const newBalance = Math.max(0, totalAmount - newPaidAmount);

    // Dynamic String/Enum status mapping
    let newStatus: any = 'PARTIAL';
    if (newPaidAmount >= totalAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount === 0) {
      newStatus = 'PENDING';
    }

    // Generate unique Receipt Number (REC-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const paymentCount = await db.payment.count();
    const receiptNo = `REC-${currentYear}-${(paymentCount + 1).toString().padStart(4, '0')}`;

    // Transaction execution
    const paymentResult = await db.$transaction(async (tx) => {
      // 1. Create Payment Record
      const paymentRecord = await tx.payment.create({
        data: {
          feePlanId: currentFeePlan.id,
          amount: installmentAmount,
          mode: paymentMode,
          receiptNo,
          ...(transactionRef ? { transactionRef } : {}),
        },
      });

      // 2. Update FeePlan
      const updatedPlan = await tx.feePlan.update({
        where: { id: currentFeePlan.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
      });

      // 3. Mark installments as PAID sequentially based on amount
      if (installmentId) {
        await tx.installment.update({
          where: { id: installmentId },
          data: { status: 'PAID' },
        });
      } else {
        let remainingCashToAllocate = installmentAmount;
        for (const inst of currentFeePlan.installments) {
          if (inst.status !== 'PAID' && remainingCashToAllocate >= Number(inst.amount)) {
            await tx.installment.update({
              where: { id: inst.id },
              data: { status: 'PAID' },
            });
            remainingCashToAllocate -= Number(inst.amount);
          }
        }
      }

      return { paymentRecord, updatedPlan };
    });

    // 4. Send Email Receipt with official template
    if (student.user?.email) {
      sendPaymentReceiptEmail({
        toEmail: student.user.email,
        studentName: student.fullName,
        amountReceived: installmentAmount,
        outstandingBalance: newBalance,
        receiptNumber: receiptNo,
        paymentMode,
      }).catch((mailErr) =>
        console.error('Payment receipt email dispatch failed:', mailErr)
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${installmentAmount.toLocaleString('en-IN')} recorded successfully.`,
      receiptNo,
      payment: paymentResult.paymentRecord,
      feeSummary: {
        totalAmount,
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });
  } catch (error: unknown) {
    console.error('Process fee installment error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Database error processing fee installment.',
      },
      { status: 500 }
    );
  }
}