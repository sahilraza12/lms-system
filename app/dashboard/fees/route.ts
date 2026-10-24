import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all centers with their student fee plans
    const centers = await db.center.findMany({
      select: {
        id: true,
        name: true,
        centerCode: true,
        students: {
          select: {
            feePlan: {
              select: {
                totalAmount: true,
                paidAmount: true,
                balance: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    let globalTotalBilled = 0;
    let globalTotalCollected = 0;
    let globalTotalBalance = 0;

    const centerBreakdowns = centers.map((center) => {
      let centerBilled = 0;
      let centerCollected = 0;
      let centerBalance = 0;

      center.students.forEach((student) => {
        if (student.feePlan) {
          centerBilled += student.feePlan.totalAmount;
          centerCollected += student.feePlan.paidAmount;
          centerBalance += student.feePlan.balance;
        }
      });

      globalTotalBilled += centerBilled;
      globalTotalCollected += centerCollected;
      globalTotalBalance += centerBalance;

      const recoveryRate =
        centerBilled > 0 ? Math.round((centerCollected / centerBilled) * 100) : 100;

      return {
        id: center.id,
        name: center.name,
        code: center.centerCode,
        enrolledCount: center.students.length,
        billed: centerBilled,
        collected: centerCollected,
        balance: centerBalance,
        recoveryRate,
      };
    });

    // 2. Fetch last 15 system-wide payments
    const recentPayments = await db.payment.findMany({
      take: 15,
      orderBy: { paymentDate: 'desc' },
      include: {
        feePlan: {
          include: {
            student: {
              select: {
                fullName: true,
                studentCode: true,
                center: { select: { name: true, centerCode: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalBilled: globalTotalBilled,
        totalCollected: globalTotalCollected,
        totalBalance: globalTotalBalance,
        overallRecoveryRate:
          globalTotalBilled > 0
            ? Math.round((globalTotalCollected / globalTotalBilled) * 100)
            : 100,
      },
      centerBreakdowns,
      recentPayments,
    });
  } catch (error: unknown) {
    console.error('Fetch Central Fees Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to aggregate revenue metrics.',
      },
      { status: 500 }
    );
  }
}