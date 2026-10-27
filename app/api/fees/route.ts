import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 1. GET: Central Stats OR Student Fee Plan OR Center Students List
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // 'analytics' | 'all'
    const role = user.role?.toUpperCase();

    // Case A: Student Portal Self View
    if (role === 'STUDENT') {
      const currentUserId = (user as any)?.id || (user as any)?.userId;
      const currentUserEmail = (user as any)?.email;
      const currentStudentCode = (user as any)?.studentCode;

      const student = await db.student.findFirst({
        where: {
          OR: [
            ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
            ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
            ...(currentStudentCode ? [{ studentCode: currentStudentCode }] : []),
          ],
        },
        select: { id: true },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
      }

      const feePlan = await db.feePlan.findFirst({
        where: { studentId: student.id },
        include: {
          student: {
            include: {
              course: true,
              center: true,
            },
          },
          installments: { orderBy: { dueDate: 'asc' } },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });

      return NextResponse.json({
        success: true,
        feePlan: feePlan
          ? {
              ...feePlan,
              totalAmount: Number(feePlan.totalAmount),
              paidAmount: Number(feePlan.paidAmount),
              balance: Number(feePlan.balance),
              payments: (feePlan.payments || []).map((p) => ({
                ...p,
                amount: Number(p.amount),
                receiptUrl: `/receipt/${p.receiptNo || p.id}?from=student`,
              })),
            }
          : null,
      });
    }

    // Case B: Central Admin Analytics (Agar mode=analytics ho)
    if (mode === 'analytics') {
      const centers = await db.center.findMany({
        select: {
          id: true,
          name: true,
          centerCode: true,
          students: {
            select: {
              id: true,
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
            const billed = Number(student.feePlan.totalAmount || 0);
            const paid = Number(student.feePlan.paidAmount || 0);
            const balance = Number(student.feePlan.balance || Math.max(0, billed - paid));

            centerBilled += billed;
            centerCollected += paid;
            centerBalance += balance;
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

      const rawPayments = await db.payment.findMany({
        take: 15,
        orderBy: { paymentDate: 'desc' },
        include: {
          feePlan: {
            include: {
              student: {
                select: {
                  id: true,
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
        recentPayments: rawPayments.map((pay) => ({
          id: pay.id,
          receiptNo: pay.receiptNo || pay.id,
          amount: Number(pay.amount),
          mode: pay.mode,
          paymentDate: pay.paymentDate,
          downloadUrl: `/receipt/${pay.receiptNo || pay.id}`,
          student: pay.feePlan?.student,
        })),
      });
    }

    // Case C: Standard Cashier Ledger List (All plans)
    const feePlans = await db.feePlan.findMany({
      include: {
        student: {
          include: {
            course: true,
            center: true,
          },
        },
        installments: { orderBy: { dueDate: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: feePlans.length,
      feePlans: feePlans.map((fp) => ({
        ...fp,
        totalAmount: Number(fp.totalAmount),
        paidAmount: Number(fp.paidAmount),
        balance: Number(fp.balance),
        payments: (fp.payments || []).map((p) => ({
          ...p,
          amount: Number(p.amount),
          receiptUrl: `/receipt/${p.receiptNo || p.id}`,
        })),
      })),
    });
  } catch (error: unknown) {
    console.error('Fees Route Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve fee records.' },
      { status: 500 }
    );
  }
}

// 2. POST: Collect Payment & Issue REC-YYYY-XXXX Voucher
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const role = user?.role?.toUpperCase();

    if (!user || (role !== 'CENTER_ADMIN' && role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Center desk access required.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { studentId, feePlanId, amount, mode = 'CASH' } = body as Record<string, any>;
    const paymentAmount = Number(amount);

    if ((!studentId && !feePlanId) || isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid student ID (or feePlanId) and payment amount are required.' },
        { status: 400 }
      );
    }

    const feePlan = await db.feePlan.findFirst({
      where: {
        OR: [
          ...(feePlanId ? [{ id: feePlanId }] : []),
          ...(studentId ? [{ studentId }] : []),
        ],
      },
      include: {
        installments: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!feePlan) {
      return NextResponse.json({ error: 'Fee plan not found for this account.' }, { status: 404 });
    }

    const currentTotal = Number(feePlan.totalAmount);
    const currentPaid = Number(feePlan.paidAmount);
    const updatedPaidAmount = Math.min(currentTotal, currentPaid + paymentAmount);
    const updatedBalance = Math.max(0, currentTotal - updatedPaidAmount);

    const nextStatus =
      updatedPaidAmount >= currentTotal && currentTotal > 0
        ? 'PAID'
        : updatedPaidAmount > 0
        ? 'PARTIAL'
        : 'PENDING';

    // Standard REC-YYYY-XXXX Serial Generation
    const currentYear = new Date().getFullYear();
    const totalPaymentsCount = await db.payment.count();
    const receiptNo = `REC-${currentYear}-${(totalPaymentsCount + 1).toString().padStart(4, '0')}`;
    const receiptUrl = `/receipt/${receiptNo}`;

    const [updatedFeePlan, payment] = await db.$transaction(async (tx) => {
      const updatedPlan = await tx.feePlan.update({
        where: { id: feePlan.id },
        data: {
          paidAmount: updatedPaidAmount,
          balance: updatedBalance,
          status: nextStatus,
        },
      });

      const newPayment = await tx.payment.create({
        data: {
          feePlanId: feePlan.id,
          amount: paymentAmount,
          mode,
          receiptNo,
          receiptUrl,
          paymentDate: new Date(),
        },
      });

      // Settle pending installments
      let remainingCredit = paymentAmount;
      for (const inst of feePlan.installments) {
        if (remainingCredit <= 0) break;
        const instAmount = Number(inst.amount);

        if (remainingCredit >= instAmount) {
          await tx.installment.update({
            where: { id: inst.id },
            data: { status: 'PAID' },
          });
          remainingCredit -= instAmount;
        }
      }

      return [updatedPlan, newPayment];
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully.`,
      receiptNo,
      receiptUrl,
      feePlan: {
        ...updatedFeePlan,
        totalAmount: Number(updatedFeePlan.totalAmount),
        paidAmount: Number(updatedFeePlan.paidAmount),
        balance: Number(updatedFeePlan.balance),
      },
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
    });
  } catch (error: unknown) {
    console.error('Record fee payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
}