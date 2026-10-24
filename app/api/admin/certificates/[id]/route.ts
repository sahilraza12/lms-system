import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 401 }
      );
    }

    // Next.js 15+ / 16 dynamic route params await
    const resolvedParams = await params;
    const certificateId = resolvedParams.id;

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Valid certificate record ID is required.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Verify target certificate exists
    const existingCert = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: {
          include: {
            course: true,
            center: true,
          },
        },
      },
    });

    if (!existingCert) {
      return NextResponse.json(
        { error: 'Certificate record not found in system.' },
        { status: 404 }
      );
    }

    if (action === 'APPROVE') {
      // Retain existing official number if already generated, else generate unique identifier
      const officialCertNo =
        existingCert.certNumber ||
        `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const verificationUrl = `/verify-certificate?certNo=${officialCertNo}`;

      const updated = await db.certificate.update({
        where: { id: certificateId },
        data: {
          certNumber: officialCertNo,
          status: CertificateStatus.ISSUED,
          issueDate: new Date(),
          verificationUrl,
        },
        include: {
          student: {
            include: {
              course: true,
              center: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Certificate issued successfully.',
        certificate: updated,
      });
    }

    if (action === 'REJECT') {
      const updated = await db.certificate.update({
        where: { id: certificateId },
        data: {
          status: CertificateStatus.REJECTED,
        },
        include: {
          student: {
            include: {
              course: true,
              center: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Certificate request rejected.',
        certificate: updated,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action payload. Expected "APPROVE" or "REJECT".' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Certificate update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update certificate record.' },
      { status: 500 }
    );
  }
}

// Optional GET handler: Fetch single certificate detail by ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const certificateId = resolvedParams.id;

    const cert = await db.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: {
          include: {
            course: true,
            center: true,
            feePlan: true,
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: 'Certificate record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error: unknown) {
    console.error('Fetch single certificate error:', error);
    return NextResponse.json({ error: 'Failed to retrieve certificate detail.' }, { status: 500 });
  }
}