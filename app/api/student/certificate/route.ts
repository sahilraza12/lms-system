import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// 1. GET: Fetch certificates OR Redirect if clicked directly from browser
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only' },
        { status: 401 }
      );
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
        ],
      },
      include: {
        course: { select: { title: true } },
        feePlan: { select: { balance: true, status: true } },
        certificates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const issuedCert = student.certificates.find(
      (c) => c.status === CertificateStatus.ISSUED || c.status === CertificateStatus.APPROVED
    );

    // Browser navigation check: If student directly clicks the link from UI
    const acceptHeader = req.headers.get('accept') || '';
    const isDirectBrowserHit = acceptHeader.includes('text/html');

    if (isDirectBrowserHit) {
      if (issuedCert?.verificationUrl) {
        return NextResponse.redirect(new URL(issuedCert.verificationUrl, req.url));
      }
      // Agar public verification page hai
      if (issuedCert) {
        return NextResponse.redirect(new URL(`/verify/${issuedCert.certNumber}`, req.url));
      }
      // Agar abhi issue nahi hua to student portal par flash/message ke sath wapas bhej dein
      return NextResponse.redirect(new URL('/student/portal?cert=pending', req.url));
    }

    const hasPendingBalance = Number(student.feePlan?.balance || 0) > 0;

    return NextResponse.json({
      success: true,
      eligible: !hasPendingBalance,
      pendingBalance: Number(student.feePlan?.balance || 0),
      certificates: student.certificates,
    });
  } catch (error: unknown) {
    console.error('Fetch student certificates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve certificates' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// 2. POST: Submit a new certificate request (Blocked if fee balance is due)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const certType = typeof body?.certType === 'string' && body.certType.trim()
      ? body.certType.trim()
      : 'Course Completion';

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
        ],
      },
      include: {
        feePlan: true,
        certificates: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Clearance Check: Pending fee balance prevents request submission
    const outstandingBalance = Number(student.feePlan?.balance || 0);
    if (outstandingBalance > 0) {
      return NextResponse.json(
        {
          error: `Clearance required: Outstanding fee balance of ₹${outstandingBalance.toLocaleString('en-IN')} must be settled prior to certificate issuance.`,
          balance: outstandingBalance,
        },
        { status: 400 }
      );
    }

    // Duplicate Check: Check if an active non-rejected request already exists
    const existingReq = student.certificates.find(
      (c) => c.certType === certType && c.status !== CertificateStatus.REJECTED
    );

    if (existingReq) {
      return NextResponse.json(
        {
          error: `A certificate request for '${certType}' is already ${existingReq.status.toLowerCase()}.`,
          status: existingReq.status,
        },
        { status: 400 }
      );
    }

    // Unique Certificate Tracking Serial
    const tempCertNumber = `CERT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const newCert = await db.certificate.create({
      data: {
        certNumber: tempCertNumber,
        studentId: student.id,
        certType,
        status: CertificateStatus.REQUESTED,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate request submitted successfully for directorate verification.',
      certificate: newCert,
    });
  } catch (error: unknown) {
    console.error('Certificate request error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit certificate request' },
      { status: 500 }
    );
  }
}