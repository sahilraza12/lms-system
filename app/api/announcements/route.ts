import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NoticePriority, Role } from '@prisma/client';

// Helper: Verify Admin Authorization safely
function isAuthorizedAdmin(user: any): boolean {
  if (!user) return false;
  const role = user.role?.toUpperCase();
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// 1. Fetch all circulars with target scope details
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 403 }
      );
    }

    const announcements = await db.announcement.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
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
      announcements: announcements.map((item) => ({
        ...item,
        isPinned: item.priority === NoticePriority.URGENT,
      })),
      centers,
    });
  } catch (error: any) {
    console.error('Fetch Announcements Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch circular broadcasts.' },
      { status: 500 }
    );
  }
}

// 2. Broadcast a new official circular
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const { title, content, targetRole, centerId, isPinned, priority } = body;

    if (!title || !content || !title.trim() || !content.trim()) {
      return NextResponse.json(
        { error: 'Circular heading title and message content are required.' },
        { status: 400 }
      );
    }

    // Resolve current admin user ID safely
    const senderUserId = (user as any)?.id || (user as any)?.userId;

    // Normalize target role (agar ALL ya empty ho toh null)
    let parsedTargetRole: Role | null = null;
    if (targetRole && targetRole !== 'ALL') {
      parsedTargetRole = targetRole.toUpperCase() as Role;
    }

    // Map priority enum safely
    const computedPriority =
      priority === 'URGENT' || isPinned === true
        ? NoticePriority.URGENT
        : NoticePriority.NORMAL;

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority: computedPriority,
        senderId: senderUserId || undefined,
        senderRole: (user?.role?.toUpperCase() as Role) || Role.ADMIN,
        senderName:
          (user as any)?.fullName ||
          (user as any)?.name ||
          user?.email ||
          'Central Academic Office',
        targetRole: parsedTargetRole,
        centerId: centerId && centerId !== 'ALL' ? centerId : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Official circular broadcasted across designated channels.',
      announcement: {
        ...announcement,
        isPinned: announcement.priority === NoticePriority.URGENT,
      },
    });
  } catch (error: any) {
    console.error('Broadcast Circular Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch circular broadcast.' },
      { status: 500 }
    );
  }
}

// 3. Delete circular
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative credentials required.' },
        { status: 403 }
      );
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
      { error: error?.message || 'Failed to delete circular.' },
      { status: 500 }
    );
  }
}