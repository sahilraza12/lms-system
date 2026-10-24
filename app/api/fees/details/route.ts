import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required.' }, { status: 400 });
    }

    const feeDetails = await prisma.feePlan.findUnique({
      where: { studentId },
      include: {
        installments: {
          orderBy: { dueDate: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!feeDetails) {
      return NextResponse.json(
        { error: 'No fee plan configured for this student.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, feeDetails });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Fetch Fee Details Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch fee details.',
      },
      { status: 500 }
    );
  }
}