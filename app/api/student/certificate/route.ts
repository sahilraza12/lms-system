import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { CertificateStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access only' }, { status: 401 });
    }

    const { certType } = await req.json();
    if (!certType) {
      return NextResponse.json({ error: 'Certificate type is required' }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { userId: user.userId },
      include: {
        feePlan: true,
        certificates: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    if (student.feePlan && student.feePlan.balance > 0) {
      return NextResponse.json(
        { error: `Cannot request certificate. Pending balance: ₹${student.feePlan.balance}` },
        { status: 400 }
      );
    }

    const existingReq = student.certificates.find(
      (c) => c.certType === certType && c.status !== CertificateStatus.REJECTED
    );
    if (existingReq) {
      return NextResponse.json(
        { error: `A certificate request for '${certType}' is already ${existingReq.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const tempCertNumber = `REQ-${Date.now().toString().slice(-6)}`;

    const newCert = await db.certificate.create({
      data: {
        certNumber: tempCertNumber,
        studentId: student.id,
        certType,
        status: CertificateStatus.REQUESTED,
      },
    });

    return NextResponse.json({
      message: 'Certificate request submitted successfully',
      certificate: newCert,
    });
  } catch (error) {
    console.error('Certificate request error:', error);
    return NextResponse.json({ error: 'Failed to submit certificate request' }, { status: 500 });
  }
}