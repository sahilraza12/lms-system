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

    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('isActive' in body) ||
      typeof body.isActive !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'isActive must be a boolean.' },
        { status: 400 }
      );
    }

    const updatedCenter = await db.center.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Center ${body.isActive ? 'activated' : 'suspended'} successfully`,
      center: updatedCenter,
    });
  } catch (error: unknown) {
    console.error('Status toggle error:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Center not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}