import { NoticePriority, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type CircularScope = 'ALL' | 'CENTERS' | 'STUDENTS' | 'SPECIFIC_CENTER';

function isAdmin(role: string) {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

function toCircularScope(targetRole: Role | null, centerId: string | null): CircularScope {
  if (centerId) return 'SPECIFIC_CENTER';
  if (targetRole === Role.CENTER_ADMIN) return 'CENTERS';
  if (targetRole === Role.STUDENT) return 'STUDENTS';
  return 'ALL';
}

function serializeCircular<T extends {
  targetRole: Role | null;
  centerId: string | null;
  priority: NoticePriority;
}>(
  announcement: T,
) {
  return {
    ...announcement,
    scope: toCircularScope(announcement.targetRole, announcement.centerId),
    isPinned: announcement.priority === NoticePriority.URGENT,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [announcements, centers] = await Promise.all([
      db.announcement.findMany({
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          center: {
            select: { id: true, name: true, centerCode: true },
          },
        },
      }),
      db.center.findMany({
        select: { id: true, name: true, centerCode: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      announcements: announcements.map(serializeCircular),
      centers,
    });
  } catch (error: unknown) {
    console.error('Fetch Announcements Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circular broadcasts.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const content = typeof input.content === 'string' ? input.content.trim() : '';
    const scope = input.scope;
    const centerId = typeof input.centerId === 'string' ? input.centerId.trim() : '';
    const isPinned = input.isPinned === true;

    const scopes: CircularScope[] = ['ALL', 'CENTERS', 'STUDENTS', 'SPECIFIC_CENTER'];
    if (!title || !content || typeof scope !== 'string' || !scopes.includes(scope as CircularScope)) {
      return NextResponse.json(
        { error: 'A title, message, and valid audience scope are required.' },
        { status: 400 },
      );
    }
    if (title.length > 200 || content.length > 10_000) {
      return NextResponse.json(
        { error: 'The title or message exceeds the maximum allowed length.' },
        { status: 400 },
      );
    }
    if (scope === 'SPECIFIC_CENTER' && !centerId) {
      return NextResponse.json(
        { error: 'Select a center for a center-specific circular.' },
        { status: 400 },
      );
    }

    const scopedCenter = scope === 'SPECIFIC_CENTER'
      ? await db.center.findUnique({ where: { id: centerId }, select: { id: true } })
      : null;
    if (scope === 'SPECIFIC_CENTER' && !scopedCenter) {
      return NextResponse.json({ error: 'Selected center was not found.' }, { status: 404 });
    }

    const targetRole =
      scope === 'CENTERS'
        ? Role.CENTER_ADMIN
        : scope === 'STUDENTS'
          ? Role.STUDENT
          : null;
    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        priority: isPinned ? NoticePriority.URGENT : NoticePriority.NORMAL,
        senderId: user.userId,
        senderRole: user.role as Role,
        senderName: user.fullName || user.email,
        targetRole,
        centerId: scopedCenter?.id ?? null,
      },
      include: {
        center: { select: { id: true, name: true, centerCode: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Circular published successfully.',
      circular: serializeCircular(announcement),
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Broadcast Circular Error:', error);
    return NextResponse.json(
      { error: error instanceof SyntaxError ? 'Invalid request body.' : 'Failed to publish circular.' },
      { status: error instanceof SyntaxError ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Circular ID is required.' }, { status: 400 });
    }

    const result = await db.announcement.deleteMany({ where: { id } });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Circular was not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Circular deleted.' });
  } catch (error: unknown) {
    console.error('Delete Circular Error:', error);
    return NextResponse.json({ error: 'Failed to delete circular.' }, { status: 500 });
  }
}
