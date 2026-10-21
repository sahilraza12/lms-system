import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student login required' }, { status: 401 });
    }

    // Explicit type-safe id check
    const userId = (user as { id?: string; userId?: string }).id || (user as { id?: string; userId?: string }).userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    const student = await db.student.findUnique({
      where: { userId },
      select: { id: true, courseId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { taskId, submissionUrl, remarks } = body as Record<string, unknown>;

    if (
      typeof taskId !== 'string' ||
      !taskId ||
      typeof submissionUrl !== 'string' ||
      !submissionUrl.trim() ||
      (remarks !== undefined && typeof remarks !== 'string')
    ) {
      return NextResponse.json(
        { error: 'Task ID and Submission URL are required' },
        { status: 400 }
      );
    }

    const task = await db.task.findFirst({
      where: { id: taskId, courseId: student.courseId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found for this student' }, { status: 404 });
    }

    const submission = await db.taskSubmission.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId: student.id,
        },
      },
      update: {
        submissionUrl: submissionUrl.trim(),
        remarks: typeof remarks === 'string' ? remarks.trim() : '',
        submittedAt: new Date(),
      },
      create: {
        taskId,
        studentId: student.id,
        submissionUrl: submissionUrl.trim(),
        remarks: typeof remarks === 'string' ? remarks.trim() : '',
      },
    });

    return NextResponse.json({
      message: 'Assignment submitted successfully!',
      submission,
    });
  } catch (error) {
    console.error('Task submission error:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}