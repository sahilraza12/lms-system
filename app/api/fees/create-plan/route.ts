import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { studentId, type, totalAmount, installments } = await req.json();

    if (!studentId || !totalAmount) {
      return NextResponse.json(
        { error: 'studentId and totalAmount are required.' },
        { status: 400 }
      );
    }

    // Check if FeePlan already exists for student
    const existingPlan = await prisma.feePlan.findUnique({
      where: { studentId },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Fee plan already configured for this student.' },
        { status: 409 }
      );
    }

    const feePlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.feePlan.create({
        data: {
          studentId,
          type: type || 'ONE_TIME',
          totalAmount: Number(totalAmount),
          paidAmount: 0,
          balance: Number(totalAmount),
          status: 'PENDING',
        },
      });

      // Agar EMI type hai toh scheduled installments create karein
      if (type === 'EMI' && Array.isArray(installments) && installments.length > 0) {
        await tx.installment.createMany({
          data: installments.map((inst: { dueDate: string; amount: number }) => ({
            feePlanId: plan.id,
            dueDate: new Date(inst.dueDate),
            amount: Number(inst.amount),
            status: 'PENDING',
          })),
        });
      }

      return plan;
    });

    return NextResponse.json({
      success: true,
      message: 'Fee plan established successfully.',
      feePlan,
    });
  } catch (error: unknown) {
    console.error('Create Fee Plan Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to establish fee plan.',
      },
      { status: 500 }
    );
  }
}