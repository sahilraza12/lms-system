import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('royaltyRate' in body) ||
      typeof body.royaltyRate !== 'number' ||
      !Number.isInteger(body.royaltyRate) ||
      body.royaltyRate < 0 ||
      body.royaltyRate > 100
    ) {
      return NextResponse.json(
        { error: 'Royalty rate must be a whole number between 0 and 100.' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const center = await db.center.update({
      where: { id },
      data: { royaltyRate: body.royaltyRate },
      select: { id: true, royaltyRate: true },
    });

    return NextResponse.json({ success: true, center });
  } catch (error: unknown) {
    console.error('Update Center Royalty Rate Error:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Center not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update center royalty rate.' }, { status: 500 });
  }
}
