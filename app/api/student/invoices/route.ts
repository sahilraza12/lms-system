import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student login required.' },
        { status: 401 }
      );
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;
    const currentStudentCode = (user as any)?.studentCode || (user as any)?.identifier;

    // Resolve student record via userId, id, email, or studentCode
    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
          ...(currentStudentCode ? [{ studentCode: currentStudentCode }] : []),
        ],
      },
      include: {
        user: { select: { id: true, email: true } },
        course: { select: { id: true, title: true, totalFee: true, duration: true } },
        center: { select: { id: true, name: true, centerCode: true, phone: true, address: true } },
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

    const centerName = student.center?.name || 'VIQ Authorized Study Directorate';
    const centerCode = student.center?.centerCode || 'CTR-001';
    const centerAddress = student.center?.address || 'Authorized Study Campus';
    const courseTitle = student.course?.title || 'Technical Engineering Track';
    const courseDuration = student.course?.duration || '6 Months';

    // Invoices list mapped for voucher canvas and table rendering
    const invoices = (feePlan?.payments || []).map((pay) => {
      const receiptIdentifier = pay.receiptNo || pay.id;
      return {
        id: pay.id,
        paymentId: pay.id,
        receiptNo: pay.receiptNo || pay.id,
        amount: Number(pay.amount),
        mode: pay.mode,
        paymentMode: pay.mode,
        paymentDate: pay.paymentDate,
        transactionRef: (pay as any).transactionRef || '',
        date: new Date(pay.paymentDate).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        downloadUrl: `/receipt/${receiptIdentifier}?from=student`,
        receiptUrl: `/receipt/${receiptIdentifier}?from=student`,
        // Voucher canvas metadata fallback
        centerName,
        centerCode,
        address: centerAddress,
        courseTitle,
        duration: courseDuration,
      };
    });

    // Installments schedule with overdue calculation
    const installments = (feePlan?.installments || []).map((inst) => {
      const dueDateObj = new Date(inst.dueDate);
      const isOverdue = inst.status === 'PENDING' && dueDateObj < new Date();

      return {
        id: inst.id,
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
        title: courseTitle,
        duration: courseDuration,
        centerName,
        centerCode,
        address: centerAddress,
      },
      billingSummary: {
        feeType: feePlan?.type || 'ONE_TIME',
        totalAmount,
        paidAmount,
        balance,
        status,
        clearancePercentage:
          totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 100,
      },
      feePlan: {
        totalAmount,
        paidAmount,
        balance,
        status,
      },
      invoices,
      payments: invoices,
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