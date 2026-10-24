import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only.' },
        { status: 401 },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const { taskId, studentId, fileUrl, remarks, unsubmit } = body as {
      taskId?: unknown;
      studentId?: unknown;
      fileUrl?: unknown;
      remarks?: unknown;
      unsubmit?: unknown;
    };

    if (
      typeof taskId !== 'string' ||
      !taskId.trim() ||
      (studentId !== undefined &&
        (typeof studentId !== 'string' || !studentId.trim()))
    ) {
      return NextResponse.json(
        { error: 'taskId and studentId are required.' },
        { status: 400 }
      );
    }

    const student = user.studentId
      ? await prisma.student.findUnique({
          where: { id: user.studentId },
          select: { id: true, courseId: true, teacherId: true },
        })
      : await prisma.student.findUnique({
          where: { userId: user.userId },
          select: { id: true, courseId: true, teacherId: true },
        });
    if (!student || (typeof studentId === 'string' && studentId !== student.id)) {
      return NextResponse.json(
        { error: 'Student profile is not configured for this account.' },
        { status: 403 },
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, courseId: true, teacherId: true },
    });
    if (
      !task ||
      task.courseId !== student.courseId ||
      (student.teacherId && task.teacherId !== student.teacherId)
    ) {
      return NextResponse.json({ error: 'Task or student profile was not found.' }, { status: 404 });
    }

    if (unsubmit === true) {
      await prisma.taskSubmission.deleteMany({
        where: { taskId, studentId: student.id },
      });
      return NextResponse.json({ success: true, message: 'Submission withdrawn.' });
    }

    if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return NextResponse.json({ error: 'A submission URL is required.' }, { status: 400 });
    }
    if (remarks !== undefined && remarks !== null && typeof remarks !== 'string') {
      return NextResponse.json({ error: 'Remarks must be a string.' }, { status: 400 });
    }

    const submissionUrl = fileUrl.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(submissionUrl);
    } catch {
      return NextResponse.json({ error: 'Enter a valid submission URL.' }, { status: 400 });
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json({ error: 'Submission URL must use HTTP or HTTPS.' }, { status: 400 });
    }

    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_studentId: { taskId, studentId: student.id },
      },
      update: {
        submissionUrl,
        remarks: typeof remarks === 'string' ? remarks.trim() || null : null,
        submittedAt: new Date(),
        status: 'SUBMITTED',
        feedback: null,
        reviewedAt: null,
      },
      create: {
        taskId,
        studentId: student.id,
        submissionUrl,
        fileUrls: [],
        remarks: typeof remarks === 'string' ? remarks.trim() || null : null,
        status: 'SUBMITTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully.',
      submission,
    });
  } catch (error: unknown) {
    console.error('Task Submission Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment.' },
      { status: 500 }
    );
  }
}