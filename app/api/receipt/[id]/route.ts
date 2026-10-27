import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id?: string; receiptId?: string }> }
) {
  try {
    const resolvedParams = await params;
    // Dono params name handle karein taaki folder name chahe [id] ho ya [receiptId], crash na ho
    const lookupId = resolvedParams?.id || resolvedParams?.receiptId;

    if (!lookupId) {
      return NextResponse.json(
        { error: 'Receipt voucher ID is required.' },
        { status: 400 }
      );
    }

    // 1. Exact match by receiptNo, paymentId, or latest payment for studentCode
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { receiptNo: lookupId },
          { id: lookupId },
          { feePlan: { student: { studentCode: lookupId } } },
        ],
      },
      orderBy: { paymentDate: 'desc' }, // Latest payment agar studentCode se search ho
      include: {
        feePlan: {
          include: {
            student: {
              include: {
                course: true,
                center: true,
                user: { select: { email: true } },
              },
            },
            payments: {
              orderBy: { paymentDate: 'asc' },
              select: {
                id: true,
                receiptNo: true,
                amount: true,
                mode: true,
                paymentDate: true,
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.feePlan?.student) {
      return NextResponse.json(
        { error: 'Fee payment receipt not found.' },
        { status: 404 }
      );
    }

    const { feePlan } = payment;
    const { student } = feePlan;

    // Flat normalized structure for universal frontend consumption
    const receiptSummary = {
      id: payment.id,
      receiptNo: payment.receiptNo,
      amount: Number(payment.amount),
      paymentMode: payment.mode,
      paymentDate: payment.paymentDate,
      transactionRef: (payment as any).transactionRef || '',
      studentName: student.fullName,
      studentCode: student.studentCode,
      email: student.user?.email || '',
      phone: student.phone || '',
      courseTitle: student.course?.title || 'Technical Certification',
      totalCourseFee: Number(feePlan.totalAmount),
      totalPaidSoFar: Number(feePlan.paidAmount),
      remainingBalance: Number(feePlan.balance),
      feeType: feePlan.type,
      centerName: student.center?.name || 'Khanna Branch Node (VIQ-KHN-01)',
      centerCode: student.center?.centerCode || 'VIQ-KHN-01',
      address: student.center?.address || 'Authorized Study Campus',
    };

    return NextResponse.json({
      success: true,
      payment, // Original nested tree
      receipt: receiptSummary, // Flat easy-to-use format
    });
  } catch (error: unknown) {
    console.error('Fetch Receipt Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate receipt voucher.' },
      { status: 500 }
    );
  }
}