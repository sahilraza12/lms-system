import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

// 1. PATCH: Approve or Reject a candidate certificate clearance
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ certificateId?: string; id?: string; certificate?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 401 }
      );
    }

    // Handles [certificateId], [id], or [certificate] automatically
    const resolvedParams = await params;
    const certId = resolvedParams.certificateId || resolvedParams.id || resolvedParams.certificate;

    if (!certId) {
      return NextResponse.json(
        { error: 'Valid certificate record ID parameter is required.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Check existing certificate
    const existingCert = await db.certificate.findUnique({
      where: { id: certId },
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
        { error: 'Certificate clearance record not found in system.' },
        { status: 404 }
      );
    }

    // Action: APPROVE
    if (action === 'APPROVE') {
      const officialCertNo =
        existingCert.certNumber ||
        `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const verificationUrl = `/verify-certificate?certNo=${officialCertNo}`;

      const updated = await db.certificate.update({
        where: { id: certId },
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
        message: 'Certificate approved and issued successfully.',
        certificate: updated,
      });
    }

    // Action: REJECT
    if (action === 'REJECT') {
      const updated = await db.certificate.update({
        where: { id: certId },
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
    console.error('Certificate PATCH action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update certificate clearance.' },
      { status: 500 }
    );
  }
}

// 2. GET: Fetch a single certificate details by ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ certificateId?: string; id?: string; certificate?: string }> }
) {
  try {
    const resolvedParams = await params;
    const certId = resolvedParams.certificateId || resolvedParams.id || resolvedParams.certificate;

    if (!certId) {
      return NextResponse.json(
        { error: 'Certificate ID parameter is required.' },
        { status: 400 }
      );
    }

    const certificate = await db.certificate.findFirst({
      where: {
        OR: [{ id: certId }, { certNumber: certId }],
        status: CertificateStatus.ISSUED,
      },
      include: {
        student: {
          include: {
            course: true,
            center: true,
            feePlan: true,
            assignedTeacher: true,
            attendanceRecords: { select: { status: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: {
        certificateId: certificate.certNumber,
        certType: certificate.certType,
        studentName: certificate.student.fullName,
        studentCode: certificate.student.studentCode,
        courseTitle: certificate.student.course.title,
        courseCode: certificate.student.course.courseCode || 'N/A',
        duration: certificate.student.course.duration,
        level: certificate.student.course.level || 'Professional',
        centerName: certificate.student.center.name,
        mentorName: certificate.student.assignedTeacher?.fullName || 'Not assigned',
        issueDate: (certificate.issueDate || certificate.createdAt).toISOString(),
        verifiedStatus: 'Verified & Issued',
        attendancePercentage: certificate.student.attendanceRecords.length === 0
          ? 0
          : Math.round(
              (certificate.student.attendanceRecords.filter((record) => record.status === 'PRESENT').length /
                certificate.student.attendanceRecords.length) *
                100
            ),
        feeCleared: !certificate.student.feePlan || certificate.student.feePlan.balance <= 0,
      },
    });
  } catch (error: unknown) {
    console.error('Fetch single certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve certificate details.' },
      { status: 500 }
    );
  }
}