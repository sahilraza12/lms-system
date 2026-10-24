import { NextResponse } from 'next/server';
import { AttendanceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized: Teacher access only.' },
        { status: 401 },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid attendance request.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const { date, records } = input;

    if (typeof date !== 'string' || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'A date and at least one attendance record are required.' },
        { status: 400 },
      );
    }
    if (records.length > 500) {
      return NextResponse.json(
        { error: 'An attendance request cannot exceed 500 students.' },
        { status: 400 },
      );
    }

    const attendanceDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(attendanceDate.getTime()) ||
      attendanceDate.toISOString().slice(0, 10) !== date
    ) {
      return NextResponse.json({ error: 'A valid calendar date is required.' }, { status: 400 });
    }

    const validatedRecords: { studentId: string; status: AttendanceStatus }[] = [];
    const studentIds = new Set<string>();
    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return NextResponse.json({ error: 'Invalid attendance record.' }, { status: 400 });
      }
      const entry = record as Record<string, unknown>;
      if (
        typeof entry.studentId !== 'string' ||
        !entry.studentId.trim() ||
        !Object.values(AttendanceStatus).includes(entry.status as AttendanceStatus) ||
        studentIds.has(entry.studentId)
      ) {
        return NextResponse.json(
          { error: 'Attendance records must contain unique students and valid statuses.' },
          { status: 400 },
        );
      }
      studentIds.add(entry.studentId);
      validatedRecords.push({
        studentId: entry.studentId,
        status: entry.status as AttendanceStatus,
      });
    }

    const teacher = user.teacherId
      ? await prisma.teacher.findUnique({
          where: { id: user.teacherId },
          select: { id: true, isActive: true },
        })
      : await prisma.teacher.findUnique({
          where: { userId: user.userId },
          select: { id: true, isActive: true },
        });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Teacher profile is not active.' },
        { status: 403 },
      );
    }

    const assignedStudentCount = await prisma.student.count({
      where: {
        id: { in: [...studentIds] },
        teacherId: teacher.id,
      },
    });
    if (assignedStudentCount !== studentIds.size) {
      return NextResponse.json(
        { error: 'Attendance can only be recorded for students assigned to you.' },
        { status: 403 },
      );
    }

    const transactionOps = validatedRecords.map((record) =>
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
          teacherId: teacher.id,
        },
        create: {
          studentId: record.studentId,
          date: attendanceDate,
          status: record.status,
          teacherId: teacher.id,
        },
      })
    );

    await prisma.$transaction(transactionOps);

    return NextResponse.json({
      success: true,
      message: `Attendance marked successfully for ${validatedRecords.length} students.`,
    });
  } catch (error: unknown) {
    console.error('Attendance Mark Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to record attendance.',
      },
      { status: 500 }
    );
  }
}