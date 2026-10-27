import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { Prisma, Role, NoticePriority } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let roleParam = searchParams.get('role')?.toUpperCase();
    let centerId = searchParams.get('centerId');

    // Fallback: Auto-detect from active session if params are omitted
    const user = await getCurrentUser();
    if (user && !roleParam) {
      roleParam = user.role?.toUpperCase();
    }
    if (user && !centerId && (user as any)?.centerId) {
      centerId = (user as any).centerId;
    }

    const targetRole =
      roleParam === 'STUDENT'
        ? Role.STUDENT
        : roleParam === 'CENTER' || roleParam === 'CENTER_ADMIN'
          ? Role.CENTER_ADMIN
          : roleParam === 'TEACHER'
            ? Role.TEACHER
            : null;

    // Audience filter logic matching multi-tier scoping
    const audienceFilters: Prisma.AnnouncementWhereInput[] = [
      // 1. Global circulars (for everyone across the institution)
      { targetRole: null, centerId: null },
    ];

    // 2. Role-specific global circulars (e.g., All Students across all branches)
    if (targetRole) {
      audienceFilters.push({
        targetRole,
        centerId: null,
      });
    }

    // 3. Center/Branch specific circulars
    if (centerId && centerId !== 'ALL') {
      audienceFilters.push({ centerId, targetRole: null });
      if (targetRole) {
        audienceFilters.push({ centerId, targetRole });
      }
    }

    const rawAnnouncements = await db.announcement.findMany({
      where: {
        OR: audienceFilters,
      },
      include: {
        center: { select: { name: true, centerCode: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 25,
    });

    const announcements = rawAnnouncements.map((item) => ({
      ...item,
      isPinned: item.priority === NoticePriority.URGENT,
    }));

    return NextResponse.json({
      success: true,
      count: announcements.length,
      announcements,
      circulars: announcements, // Compatibility for both circulars and announcements consumer keys
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Fetch Announcements Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch circular feed.',
      },
      { status: 500 }
    );
  }
}