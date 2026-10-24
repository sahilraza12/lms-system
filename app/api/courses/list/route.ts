import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        totalFee: true,
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      success: true,
      courses: courses.map((course) => ({ ...course, price: course.totalFee })),
    });
  } catch (error: unknown) {
    console.error('Fetch Courses Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses.' },
      { status: 500 }
    );
  }
}