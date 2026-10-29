import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    // 1. Core metric counts
    const [centers, studentsCount, teachersCount, coursesCount] = await Promise.all([
      db.center.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          centerCode: true,
          address: true,
          royaltyRate: true,
          _count: {
            select: {
              students: true,
              teachers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.student.count({ where: { center: { isActive: true } } }),
      db.teacher.count({ where: { center: { isActive: true } } }),
      db.course.count(),
    ]);

    // 2. Financial Aggregates
    const feePlans = await db.feePlan.findMany({
      where: { student: { center: { isActive: true } } },
      select: {
        totalAmount: true,
        paidAmount: true,
        balance: true,
        student: { select: { centerId: true } },
      },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalBalance = 0;
    const collectedByCenter = new Map<string, number>();
    const financialsByCenter = new Map<
      string,
      { billed: number; collected: number; balance: number }
    >();

    feePlans.forEach((plan) => {
      totalBilled += plan.totalAmount;
      totalCollected += plan.paidAmount;
      totalBalance += plan.balance;
      const current = financialsByCenter.get(plan.student.centerId) ?? {
        billed: 0,
        collected: 0,
        balance: 0,
      };
      current.billed += plan.totalAmount;
      current.collected += plan.paidAmount;
      current.balance += plan.balance;
      financialsByCenter.set(plan.student.centerId, current);
      collectedByCenter.set(
        plan.student.centerId,
        (collectedByCenter.get(plan.student.centerId) ?? 0) + plan.paidAmount
      );
    });
    const royaltyRatesByCenter = new Map(centers.map((center) => [center.id, center.royaltyRate]));
    const totalHqRoyalty = Array.from(collectedByCenter).reduce(
      (total, [centerId, collected]) =>
        total + Math.round((collected * (royaltyRatesByCenter.get(centerId) ?? 25)) / 100),
      0
    );

    const recoveryRate =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    // 3. Per-center performance for every active center
    const topCenters = centers.map((center) => {
      const financials = financialsByCenter.get(center.id) ?? {
        billed: 0,
        collected: 0,
        balance: 0,
      };
      const centerRecoveryRate =
        financials.billed > 0
          ? Math.round((financials.collected / financials.billed) * 100)
          : 100;

      return {
        id: center.id,
        name: center.name,
        centerCode: center.centerCode,
        address: center.address,
        royaltyRate: center.royaltyRate,
        studentsCount: center._count.students,
        teachersCount: center._count.teachers,
        billed: financials.billed,
        collected: financials.collected,
        balance: financials.balance,
        hqRoyalty: Math.round((financials.collected * center.royaltyRate) / 100),
        recoveryRate: centerRecoveryRate,
      };
    });
    // 4. Recent Real-Time Inflow Stream (Last 6 verified payments)
    const recentPayments = await db.payment.findMany({
      where: { feePlan: { student: { center: { isActive: true } } } },
      take: 6,
      orderBy: { paymentDate: 'desc' },
      include: {
        feePlan: {
          include: {
            student: {
              select: {
                fullName: true,
                studentCode: true,
                center: {
                  select: { name: true, centerCode: true },
                },
              },
            },
          },
        },
      },
    });

    // 5. Recent Official Circulars (Last 3 notices)
    const recentAnnouncements = await db.announcement.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        targetRole: true,
        centerId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        centersCount: centers.length,
        studentsCount,
        teachersCount,
        coursesCount,
        totalBilled,
        totalCollected,
        totalBalance,
        totalHqRoyalty,
        recoveryRate,
      },
      topCenters,
      recentPayments,
      recentAnnouncements: recentAnnouncements.map((announcement) => ({
        ...announcement,
        scope: announcement.centerId
          ? 'SPECIFIC_CENTER'
          : announcement.targetRole === 'STUDENT'
            ? 'STUDENTS'
            : announcement.targetRole === 'CENTER_ADMIN'
              ? 'CENTERS'
              : 'ALL',
      })),
    });
  } catch (error: unknown) {
    console.error('Admin Overview API Error:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate administrative telemetry.' },
      { status: 500 }
    );
  }
}