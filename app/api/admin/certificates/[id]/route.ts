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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (action === 'APPROVE') {
      const officialCertNo = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const verificationUrl = `/verify-certificate?certNo=${officialCertNo}`;

      const updated = await db.certificate.update({
        where: { id },
        data: {
          certNumber: officialCertNo,
          status: CertificateStatus.ISSUED,
          issueDate: new Date(),
          verificationUrl,
        },
      });

      return NextResponse.json({ message: 'Certificate issued successfully', certificate: updated });
    } else if (action === 'REJECT') {
      const updated = await db.certificate.update({
        where: { id },
        data: {
          status: CertificateStatus.REJECTED,
        },
      });

      return NextResponse.json({ message: 'Certificate request rejected', certificate: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Certificate update error:', error);
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
  }
}