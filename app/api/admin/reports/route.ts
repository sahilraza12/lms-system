import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const today = new Date();

    // 1. Fetch Centers with Student Fee Aggregations
    const centers = await db.center.findMany({
      include: {
        students: {
          include: {
            feePlan: true,
          },
        },
      },
    });

    const centerReports = centers.map((c) => {
      let totalBilled = 0;
      let totalCollected = 0;
      let totalPending = 0;

      c.students.forEach((s) => {
        if (s.feePlan) {
          totalBilled += s.feePlan.totalAmount;
          totalCollected += s.feePlan.paidAmount;
          totalPending += s.feePlan.balance;
        }
      });

      return {
        id: c.id,
        centerCode: c.centerCode,
        name: c.name,
        studentCount: c.students.length,
        totalBilled,
        totalCollected,
        totalPending,
      };
    });

    // 2. Fetch Overdue Installments
    const overdueInstallments = await db.installment.findMany({
      where: {
        status: { not: 'PAID' },
        dueDate: { lt: today },
      },
      include: {
        feePlan: {
          include: {
            student: {
              include: {
                course: { select: { title: true } },
                center: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // 3. Overall Totals
    const overallBilled = centerReports.reduce((acc, curr) => acc + curr.totalBilled, 0);
    const overallCollected = centerReports.reduce((acc, curr) => acc + curr.totalCollected, 0);
    const overallPending = centerReports.reduce((acc, curr) => acc + curr.totalPending, 0);

    return NextResponse.json({
      summary: {
        overallBilled,
        overallCollected,
        overallPending,
        overdueCount: overdueInstallments.length,
      },
      centerReports,
      overdueInstallments,
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 });
  }
}