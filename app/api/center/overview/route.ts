import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const queryCenterId = searchParams.get('centerId');

    let resolvedCenterId: string | null = null;

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    // 1. Direct session centerId check
    if ((user as any)?.centerId) {
      resolvedCenterId = (user as any).centerId;
    } else if (currentUserId || currentUserEmail) {
      // 2. Safe check without passing 'email' directly to Center table
      const centerRecord = await db.center.findFirst({
        where: {
          OR: [
            ...(currentUserId ? [{ id: currentUserId }, { userId: currentUserId }] : []),
            ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
          ],
        },
        select: { id: true },
      });
      resolvedCenterId = centerRecord?.id || null;
    }

    if (!resolvedCenterId && queryCenterId && queryCenterId !== 'default-center-id') {
      resolvedCenterId = queryCenterId;
    }

    if (!resolvedCenterId) {
      const firstCenter = await db.center.findFirst({
        select: { id: true },
      });
      resolvedCenterId = firstCenter?.id || null;
    }

    // Agar database me koi center na mile
    if (!resolvedCenterId) {
      return NextResponse.json({
        success: true,
        stats: {
          totalGrossCollected: 0,
          netRetainedShare: 0,
          totalPendingEmis: 0,
          activeStudentsCount: 0,
          hqRoyalty: 0,
        },
        metrics: {
          studentsCount: 0,
          teachersCount: 0,
          totalBilled: 0,
          totalCollected: 0,
          totalBalance: 0,
          recoveryRate: 100,
        },
        centerInfo: null,
        students: [],
        recentPayments: [],
      });
    }

    // 1. Fetch Center Basic Info
    const centerInfo = await db.center.findUnique({
      where: { id: resolvedCenterId },
      select: {
        id: true,
        name: true,
        centerCode: true,
        phone: true,
        address: true,
        royaltyRate: true,
      },
    });

    // 2. Fetch Students & Fee Plans of this Center
    const students = await db.student.findMany({
      where: { centerId: resolvedCenterId },
      include: {
        user: { select: { email: true } },
        course: { select: { title: true } },
        assignedTeacher: { select: { fullName: true, teacherCode: true } },
        feePlan: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            balance: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Teachers count
    const teachersCount = await db.teacher.count({
      where: { centerId: resolvedCenterId },
    });

    // 4. Financial metrics
    let totalBilled = 0;
    let totalCollected = 0;
    let totalBalance = 0;

    students.forEach((s) => {
      if (s.feePlan) {
        totalBilled += Number(s.feePlan.totalAmount || 0);
        totalCollected += Number(s.feePlan.paidAmount || 0);
        totalBalance += Number(s.feePlan.balance || 0);
      }
    });

    const recoveryRate =
      totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    const royaltyRate = centerInfo?.royaltyRate ?? 25;
    const hqRoyalty = Math.round((totalCollected * royaltyRate) / 100);
    const netRetainedShare = totalCollected - hqRoyalty;

    // 5. Recent branch payments
    const recentPayments = await db.payment.findMany({
      where: {
        feePlan: {
          student: {
            centerId: resolvedCenterId,
          },
        },
      },
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: {
        feePlan: {
          include: {
            student: {
              select: { fullName: true, studentCode: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      centerInfo,
      // Frontend dashboard cards ke liye exact mapped stats
      stats: {
        totalGrossCollected: totalCollected,
        netRetainedShare,
        totalPendingEmis: totalBalance,
        activeStudentsCount: students.length,
        hqRoyalty,
        royaltyRate,
      },
      // Original summary metrics
      metrics: {
        studentsCount: students.length,
        teachersCount,
        totalBilled,
        totalCollected,
        totalBalance,
        recoveryRate,
      },
      students,
      recentPayments,
    });
  } catch (error: unknown) {
    console.error('Fetch Center Overview Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to aggregate branch metrics.',
      },
      { status: 500 }
    );
  }
}