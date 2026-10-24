import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 1. Get all courses with student counts
export async function GET() {
  try {
    const courses = await db.course.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error: unknown) {
    console.error('Fetch Courses Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course catalog.' },
      { status: 500 }
    );
  }
}

// 2. Create new course
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    const body = await req.json();
    const { title, courseCode, description, price, durationWeeks, duration, level } = body;

    const totalFee = Number(price);
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      price === undefined ||
      !Number.isFinite(totalFee) ||
      totalFee < 0
    ) {
      return NextResponse.json(
        { error: 'A course title and a valid non-negative price are required.' },
        { status: 400 }
      );
    }

    const createdCourse = await db.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        totalFee,
        duration:
          typeof duration === 'string' && duration.trim()
            ? duration.trim()
            : `${Number.isFinite(Number(durationWeeks)) && Number(durationWeeks) > 0 ? Number(durationWeeks) : 12} Weeks`,
        level: level || 'INTERMEDIATE',
        courseCode: courseCode?.trim().toUpperCase() || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: createdCourse,
    });
  } catch (error: unknown) {
    console.error('Create Course Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create course.' },
      { status: 500 }
    );
  }
}