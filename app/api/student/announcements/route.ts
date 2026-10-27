import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NoticePriority, Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access required.' },
        { status: 401 }
      );
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    // Resolve student record safely
    const student = await db.student.findFirst({
      where: {
        OR: [
          ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
          ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
        ],
      },
      select: {
        id: true,
        centerId: true,
        teacherId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found.' },
        { status: 404 }
      );
    }

    // Role condition: null (all roles) ya strictly STUDENT
    const roleMatches = [
      { targetRole: null },
      { targetRole: Role.STUDENT },
    ];

    // Multi-tier audience conditions without invalid null array in Prisma
    const audienceConditions: any[] = [
      // 1. Global system notices (no center, no teacher)
      {
        centerId: null,
        teacherId: null,
        OR: roleMatches,
      },
    ];

    if (student.centerId) {
      // 2. Center-level notices
      audienceConditions.push({
        centerId: student.centerId,
        teacherId: null,
        OR: roleMatches,
      });
    }

    if (student.teacherId) {
      // 3. Teacher/Cohort-level notices
      audienceConditions.push({
        teacherId: student.teacherId,
        OR: roleMatches,
      });
    }

    const announcements = await db.announcement.findMany({
      where: {
        OR: audienceConditions,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
        center: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      count: announcements.length,
      circulars: announcements.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        priority: item.priority,
        isPinned: item.priority === NoticePriority.URGENT,
        publishedAt: new Date(item.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        origin: item.center?.name || 'Central VIQ Directorate',
      })),
      announcements: announcements.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        priority: item.priority,
        createdAt: item.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error('Fetch Student Circulars Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch live circulars.',
      },
      { status: 500 }
    );
  }
}