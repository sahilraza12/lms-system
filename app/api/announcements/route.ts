import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// 1. Fetch all circulars with target scope details
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        center: {
          select: {
            id: true,
            name: true,
            centerCode: true,
          },
        },
      },
    });

    const centers = await db.center.findMany({
      select: { id: true, name: true, centerCode: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      announcements,
      centers,
    });
  } catch (error: any) {
    console.error('Fetch Announcements Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch circular broadcasts.' },
      { status: 500 }
    );
  }
}

// 2. Broadcast a new official circular
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, targetRole, centerId, isPinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Circular heading title and message content are required.' },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        senderId: user?.userId || 'ADMIN',
        senderRole: (user?.role as Role) || Role.ADMIN,
        senderName: user?.email || 'Central Academic Office',
        targetRole: targetRole || null,
        centerId: centerId || null,
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Official circular broadcasted across designated channels.',
      announcement,
    });
  } catch (error: any) {
    console.error('Broadcast Circular Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch circular broadcast.' },
      { status: 500 }
    );
  }
}

// 3. Delete circular
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });
    }

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Circular removed from active broadcast channels.',
    });
  } catch (error: any) {
    console.error('Delete Circular Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete circular.' },
      { status: 500 }
    );
  }
}