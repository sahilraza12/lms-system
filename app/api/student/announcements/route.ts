import { NextResponse } from 'next/server';
import { NoticePriority, Prisma, Role } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.STUDENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { userId: user.userId },
      select: { id: true, centerId: true, teacherId: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const audienceFilters: Prisma.AnnouncementWhereInput[] = [
      { targetRole: null, centerId: null, teacherId: null },
      { targetRole: Role.STUDENT, centerId: null, teacherId: null },
    ];
    if (student.centerId) {
      audienceFilters.push(
        { targetRole: null, centerId: student.centerId, teacherId: null },
        { targetRole: Role.STUDENT, centerId: student.centerId, teacherId: null },
      );
    }
    if (student.teacherId) {
      audienceFilters.push(
        { targetRole: null, centerId: null, teacherId: student.teacherId },
        { targetRole: Role.STUDENT, centerId: null, teacherId: student.teacherId },
      );
    }

    const announcements = await db.announcement.findMany({
      where: {
        OR: audienceFilters,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      circulars: announcements.map(({ priority, ...announcement }) => ({
        ...announcement,
        isPinned: priority === NoticePriority.URGENT,
      })),
    });
  } catch (error: unknown) {
    console.error('Fetch Student Circulars Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live circulars.' },
      { status: 500 }
    );
  }
}