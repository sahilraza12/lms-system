import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'CENTER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.userId;
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 401 });
    }

    const body = await req.json();
    const { name, logoUrl } = body;

    const updateData: { name?: string; logoUrl?: string | null } = {};
    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }
    if (logoUrl === null || typeof logoUrl === 'string') {
      updateData.logoUrl = logoUrl;
    }
    if (!Object.keys(updateData).length) {
      return NextResponse.json({ error: 'A valid center name or logo is required' }, { status: 400 });
    }

    const updatedCenter = await db.center.update({
      where: { userId: currentUserId },
      data: updateData,
    });

    return NextResponse.json({ success: true, center: updatedCenter });
  } catch (error) {
    console.error('Center Settings Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update branch settings' },
      { status: 500 }
    );
  }
}