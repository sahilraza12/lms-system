import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let teacherId = searchParams.get('teacherId');

    // Agar search params me teacherId nahi hai to logged-in user se check karein
    if (!teacherId) {
      const user = await getCurrentUser();
      if (user && (user as any)?.role === 'TEACHER') {
        teacherId = (user as any)?.id || (user as any)?.userId;
      }
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID parameter is required or teacher authentication missing.' },
        { status: 400 }
      );
    }

    const client: any = db;

    // Resilient query: teacherId direct match ya relation match
    const students = await client.student.findMany({
      where: {
        OR: [
          { teacherId },
          { teacher: { id: teacherId } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error: unknown) {
    console.error('Fetch Teacher Assigned Students Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch assigned students from database.',
      },
      { status: 500 }
    );
  }
}