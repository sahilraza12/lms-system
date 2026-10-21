import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: paymentId } = await params;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        feePlan: {
          include: {
            student: {
              include: {
                course: true,
                center: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Fetch receipt error:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt data' }, { status: 500 });
  }
}