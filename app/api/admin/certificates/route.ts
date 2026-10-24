import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

// 1. GET: Fetch all candidate certificates
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 401 }
      );
    }

    const certificates = await db.certificate.findMany({
      include: {
        student: {
          include: {
            course: true,
            center: true,
            feePlan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      certificates,
    });
  } catch (error: unknown) {
    console.error('Fetch certificates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates from database.' },
      { status: 500 }
    );
  }
}

// 2. POST: Issue or Request a new Certificate
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative access required.' },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 });
    }

    const { studentId, status, certType } = body as Record<string, unknown>;

    if (typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json(
        { error: 'Candidate / Student ID is required.' },
        { status: 400 }
      );
    }

    if (status !== undefined && status !== 'PENDING' && status !== 'REQUESTED' && status !== 'ISSUED') {
      return NextResponse.json(
        { error: 'Status must be REQUESTED or ISSUED.' },
        { status: 400 }
      );
    }

    if (certType !== undefined && typeof certType !== 'string') {
      return NextResponse.json({ error: 'Certificate type must be text.' }, { status: 400 });
    }

    const normalizedCertType =
      typeof certType === 'string' ? certType.trim() : 'Academic Completion';
    if (!normalizedCertType || normalizedCertType.length > 100) {
      return NextResponse.json(
        { error: 'Certificate type must be between 1 and 100 characters.' },
        { status: 400 }
      );
    }

    // Verify candidate existence
    const student = await db.student.findUnique({
      where: { id: studentId.trim() },
      include: {
        course: true,
        center: true,
        certificates: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student record not found.' },
        { status: 404 }
      );
    }

    const existingActive = student.certificates.find(
      (certificate) =>
        certificate.certType.toLowerCase() === normalizedCertType.toLowerCase() &&
        certificate.status !== CertificateStatus.REJECTED
    );

    if (existingActive) {
      return NextResponse.json(
        {
          error: `A "${normalizedCertType}" certificate with status ${existingActive.status} already exists for this candidate.`,
          certificate: existingActive,
        },
        { status: 409 }
      );
    }

    const issuedImmediately = status === 'ISSUED';
    const officialCertNo = `CERT-${new Date().getFullYear()}-${randomUUID().toUpperCase()}`;
    const newCertificate = await db.certificate.create({
      data: {
        studentId: student.id,
        certNumber: officialCertNo,
        certType: normalizedCertType,
        status: issuedImmediately ? CertificateStatus.ISSUED : CertificateStatus.REQUESTED,
        issueDate: issuedImmediately ? new Date() : null,
        verificationUrl: issuedImmediately
          ? `/verify-certificate?certNo=${encodeURIComponent(officialCertNo)}`
          : null,
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
      message: issuedImmediately
        ? 'Certificate issued successfully.'
        : 'Certificate request submitted for review.',
      certificate: newCertificate,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Certificate issuance error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue credential record.' },
      { status: 500 }
    );
  }
}