import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt voucher ID is required.' }, { status: 400 });
    }

    // 1. Search by exact Payment receiptNo OR Student Roll Code
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { receiptNo: receiptId },
          { id: receiptId },
          { feePlan: { student: { studentCode: receiptId } } },
        ],
      },
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

    if (!payment) {
      return NextResponse.json({ error: 'Fee payment receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: unknown) {
    console.error('Fetch Receipt Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt voucher.' },
      { status: 500 }
    );
  }
}