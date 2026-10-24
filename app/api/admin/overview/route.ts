import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    // 1. Core metric counts
    const [centersCount, studentsCount, teachersCount, coursesCount] = await Promise.all([
      db.center.count(),
      db.student.count(),
      db.teacher.count(),
      db.course.count(),
    ]);

    // 2. Financial Aggregates
    const feePlans = await db.feePlan.findMany({
      select: {
        totalAmount: true,
        paidAmount: true,
        balance: true,
        status: true,
      },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalBalance = 0;

    feePlans.forEach((plan) => {
      totalBilled += plan.totalAmount;
      totalCollected += plan.paidAmount;
      totalBalance += plan.balance;
    });

    const recoveryRate =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    // 3. Top Centers Performance (Calculated from enrolled students' fee plans)
    const centers = await db.center.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        centerCode: true,
        _count: {
          select: {
            students: true,
            teachers: true,
          },
        },
        students: {
          select: {
            feePlan: {
              select: {
                totalAmount: true,
                paidAmount: true,
                balance: true,
              },
            },
          },
        },
      },
      orderBy: {
        students: {
          _count: 'desc',
        },
      },
    });

    const topCenters = centers.map((c) => {
      let billed = 0;
      let collected = 0;
      let balance = 0;

      c.students.forEach((s) => {
        if (s.feePlan) {
          billed += s.feePlan.totalAmount;
          collected += s.feePlan.paidAmount;
          balance += s.feePlan.balance;
        }
      });

      const centerRecoveryRate = billed > 0 ? Math.round((collected / billed) * 100) : 100;

      return {
        id: c.id,
        name: c.name,
        centerCode: c.centerCode,
        studentsCount: c._count.students,
        teachersCount: c._count.teachers,
        billed,
        collected,
        balance,
        recoveryRate: centerRecoveryRate,
      };
    });

    // 4. Recent Real-Time Inflow Stream (Last 6 verified payments)
    const recentPayments = await db.payment.findMany({
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
        centersCount,
        studentsCount,
        teachersCount,
        coursesCount,
        totalBilled,
        totalCollected,
        totalBalance,
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