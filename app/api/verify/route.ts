import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CertificateStatus } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const certNo = searchParams.get('certNo') ?? searchParams.get('code');

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
    return NextResponse.json(
      { valid: false, error: 'Invalid or unissued certificate.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    valid: true,
    certificate: {
      certificateNumber: certificate.certNumber,
      certNumber: certificate.certNumber,
      certType: certificate.certType,
      issueDate: certificate.issueDate,
      studentName: certificate.student.fullName,
      candidateName: certificate.student.fullName,
      name: certificate.student.fullName,
      studentCode: certificate.student.studentCode,
      courseName: certificate.student.course.title,
      courseTitle: certificate.student.course.title,
      duration: certificate.student.course.duration,
      branchName: certificate.student.center.name,
      centerName: certificate.student.center.name,
    },
  });
}