import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Student login required.' }, { status: 401 });
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    // Student account resolve karein (userId ya email ke through)
    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, totalFee: true } },
        center: { select: { id: true, name: true, centerCode: true, phone: true } },
        feePlan: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
            installments: {
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found for this account.' },
        { status: 404 }
      );
    }

    const feePlan = student.feePlan;
    const totalAmount = Number(feePlan?.totalAmount || student.course?.totalFee || 0);
    const paidAmount = Number(feePlan?.paidAmount || 0);
    const balance = Number(feePlan?.balance || Math.max(0, totalAmount - paidAmount));
    const status = feePlan?.status || (balance === 0 && totalAmount > 0 ? 'PAID' : 'PENDING');

    // Invoices list with direct download link references
    const invoices = (feePlan?.payments || []).map((pay) => ({
      paymentId: pay.id,
      receiptNo: pay.receiptNo,
      amount: Number(pay.amount),
      paymentMode: pay.mode,
      date: new Date(pay.paymentDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      downloadUrl: `/receipt/${pay.id}`,
    }));

    // Installment schedule
    const installments = (feePlan?.installments || []).map((inst) => {
      const dueDateObj = new Date(inst.dueDate);
      const isOverdue = inst.status === 'PENDING' && dueDateObj < new Date();

      return {
        installmentId: inst.id,
        amount: Number(inst.amount),
        dueDate: dueDateObj.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        status: inst.status,
        isOverdue,
      };
    });

    return NextResponse.json({
      success: true,
      studentDetails: {
        id: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        email: student.user?.email,
        phone: student.phone,
      },
      courseDetails: {
        title: student.course?.title || 'Registered Course',
        centerName: student.center?.name || 'Khanna Branch Node',
      },
      billingSummary: {
        feeType: feePlan?.type || 'ONE_TIME',
        totalAmount,
        paidAmount,
        balance,
        status,
        clearancePercentage: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100,
      },
      invoices,
      installments,
    });
  } catch (error: unknown) {
    console.error('Fetch student invoices error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve invoice ledger.' },
      { status: 500 }
    );
  }
}