import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper: Resilient Teacher Profile Lookup across session identifiers
async function resolveTeacher(user: any) {
  if (!user || user.role?.toUpperCase() !== 'TEACHER') {
    return null;
  }

  const currentTeacherId = user.teacherId;
  const currentUserId = user.id || user.userId;

  return await db.teacher.findFirst({
    where: {
      OR: [
        ...(currentTeacherId ? [{ id: currentTeacherId }] : []),
        ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
      ],
    },
    select: {
      id: true,
      fullName: true,
      teacherCode: true,
      specialization: true,
      isActive: true,
    },
  });
}

// 1. GET: Fetch cohort students assigned to this mentor with attendance logs
export async function GET() {
  try {
    const user = await getCurrentUser();
    const teacher = await resolveTeacher(user);

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile not found.' },
        { status: 403 }
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
    console.error('Fetch Teacher Students API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assigned students.' },
      { status: 500 }
    );
  }
}

// 2. POST: Save / Sync Daily Attendance Register
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const teacher = await resolveTeacher(user);

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile not found.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.records)) {
      return NextResponse.json(
        { error: 'Invalid attendance payload. Expected array of student records.' },
        { status: 400 }
      );
    }

    // Set normalized day boundary for clean date comparison
    const targetDate = body.date ? new Date(body.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Dynamic delegate check: supports both 'attendance' and 'attendanceRecord' model names
    const attendanceDelegate = (db as any).attendance || (db as any).attendanceRecord;

    if (!attendanceDelegate) {
      return NextResponse.json(
        { error: 'Attendance model delegate not found in Prisma Client.' },
        { status: 500 }
      );
    }

    // Synchronize each candidate attendance entry
    for (const record of body.records) {
      if (!record.studentId) continue;

      const existingRecord = await attendanceDelegate.findFirst({
        where: {
          studentId: record.studentId,
          date: {
            gte: targetDate,
            lt: nextDate,
          },
        },
      });

      if (existingRecord) {
        await attendanceDelegate.update({
          where: { id: existingRecord.id },
          data: {
            status: record.status || 'PRESENT',
            remarks: record.remarks || null,
          },
        });
      } else {
        await attendanceDelegate.create({
          data: {
            studentId: record.studentId,
            date: targetDate,
            status: record.status || 'PRESENT',
            remarks: record.remarks || null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance synchronized successfully for ${body.records.length} students.`,
      date: targetDate,
    });
  } catch (error: unknown) {
    console.error('Save Attendance Register Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save attendance register.' },
      { status: 500 }
    );
  }
}