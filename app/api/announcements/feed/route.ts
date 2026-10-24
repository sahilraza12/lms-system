import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role')?.toUpperCase();
    const centerId = searchParams.get('centerId');
    const teacherId = searchParams.get('teacherId');

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
      // 1. Global circulars (for everyone)
      { targetRole: null, centerId: null, teacherId: null },
    ];

    // 2. Global role-specific circulars (e.g. All Students across all centers)
    if (targetRole) {
      audienceFilters.push({
        targetRole,
        centerId: null,
        teacherId: null,
      });
    }

    // 3. Center-specific circulars
    if (centerId) {
      audienceFilters.push({ centerId, targetRole: null });
      if (targetRole) {
        audienceFilters.push({ centerId, targetRole });
      }
    }

    // 4. Teacher's specific cohort circulars
    if (teacherId && (targetRole === Role.STUDENT || targetRole === Role.TEACHER)) {
      audienceFilters.push({ teacherId });
    }

    const announcements = await db.announcement.findMany({
      where: {
        OR: audienceFilters,
      },
      include: {
        center: { select: { name: true, centerCode: true } },
        teacher: { select: { fullName: true, teacherCode: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 25,
    });

    return NextResponse.json({ success: true, announcements });
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