import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CertificateStatus } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const certNo = searchParams.get('certNo');

  if (!certNo) {
    return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 });
  }

  const certificate = await db.certificate.findFirst({
    where: {
      certNumber: certNo,
      status: CertificateStatus.ISSUED,
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

  if (!certificate) {
    return NextResponse.json({ valid: false, message: 'Invalid or Unissued Certificate' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    certificate: {
      certNumber: certificate.certNumber,
      certType: certificate.certType,
      issueDate: certificate.issueDate,
      candidateName: certificate.student.fullName,
      studentCode: certificate.student.studentCode,
      courseTitle: certificate.student.course.title,
      duration: certificate.student.course.duration,
      centerName: certificate.student.center.name,
    },
  });
}