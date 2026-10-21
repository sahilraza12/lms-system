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
    const { isActive } = await req.json();

    const updatedCenter = await db.center.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      message: `Center ${isActive ? 'activated' : 'suspended'} successfully`,
      center: updatedCenter,
    });
  } catch (error) {
    console.error('Status toggle error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}