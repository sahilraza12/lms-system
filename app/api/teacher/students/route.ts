import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized: Teacher access only.' }, { status: 401 });
    }

    const teacher = currentUser.teacherId
      ? await db.teacher.findUnique({
          where: { id: currentUser.teacherId },
          select: { id: true, fullName: true, teacherCode: true, specialization: true },
        })
      : await db.teacher.findUnique({
          where: { userId: currentUser.userId },
          select: { id: true, fullName: true, teacherCode: true, specialization: true },
        });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile is not configured.' },
        { status: 403 },
      );
    }

    const students = await db.student.findMany({
      where: { teacherId: teacher.id },
      include: {
        user: { select: { email: true } },
        course: { select: { id: true, title: true } },
        center: { select: { id: true, name: true, centerCode: true } },
        attendanceRecords: {
          take: 5,
          orderBy: { date: 'desc' },
          select: { id: true, date: true, status: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      teacher,
      count: students.length,
      students,
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Fetch Teacher Students API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned students.' },
      { status: 500 }
    );
  }
}