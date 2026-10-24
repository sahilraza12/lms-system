import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 1. Fetch all assignments created by the mentor with student submissions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized: Teacher access only.' },
        { status: 401 },
      );
    }

    const teacher = user.teacherId
      ? await db.teacher.findUnique({
          where: { id: user.teacherId },
          select: { id: true, isActive: true },
        })
      : await db.teacher.findUnique({
          where: { userId: user.userId },
          select: { id: true, isActive: true },
        });
    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Teacher profile is not active.' },
        { status: 403 },
      );
    }

    const tasks = await db.task.findMany({
      where: { teacherId: teacher.id },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                studentCode: true,
                course: { select: { title: true } },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      teacherId: teacher.id,
      tasks,
    });
  } catch (error: unknown) {
    console.error('Fetch Teacher Tasks Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments and reviews.' },
      { status: 500 }
    );
  }
}

// 2. Broadcast a new lab task to the cohort
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized: Teacher access only.' },
        { status: 401 },
      );
    }

    const teacher = user.teacherId
      ? await db.teacher.findUnique({
          where: { id: user.teacherId },
          select: { id: true, isActive: true },
        })
      : await db.teacher.findUnique({
          where: { userId: user.userId },
          select: { id: true, isActive: true },
        });
    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Teacher profile is not active.' },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid task request.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const { title, description, dueDate } = input;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required.' },
        { status: 400 }
      );
    }

    const parsedDueDate = typeof dueDate === 'string' ? new Date(dueDate) : null;
    if (!parsedDueDate || Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json(
        { error: 'A valid submission deadline is required.' },
        { status: 400 }
      );
    }

    const assignedStudent = await db.student.findFirst({
      where: { teacherId: teacher.id },
      select: { courseId: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!assignedStudent) {
      return NextResponse.json(
        { error: 'Assign at least one student before creating a course task.' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        dueDate: parsedDueDate,
        teacherId: teacher.id,
        courseId: assignedStudent.courseId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'New lab task assigned to cohort.',
      task,
    });
  } catch (error: unknown) {
    console.error('Create Task Error:', error);
    return NextResponse.json(
      { error: 'Failed to create task.' },
      { status: 500 }
    );
  }
}

// 3. Review & Grade a submission (Update status to REVIEWED)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized: Teacher access only.' },
        { status: 401 },
      );
    }

    const teacher = user.teacherId
      ? await db.teacher.findUnique({
          where: { id: user.teacherId },
          select: { id: true, isActive: true },
        })
      : await db.teacher.findUnique({
          where: { userId: user.userId },
          select: { id: true, isActive: true },
        });
    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Teacher profile is not active.' },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid review request.' }, { status: 400 });
    }
    const { submissionId, status, feedback } = body as Record<string, unknown>;

    if (typeof submissionId !== 'string' || !submissionId.trim()) {
      return NextResponse.json(
        { error: 'Submission ID is required.' },
        { status: 400 }
      );
    }

    const submission = await db.taskSubmission.findFirst({
      where: {
        id: submissionId,
        task: { teacherId: teacher.id },
      },
      select: { id: true },
    });
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    const updated = await db.taskSubmission.update({
      where: { id: submission.id },
      data: {
        status: status === 'SUBMITTED' ? 'SUBMITTED' : 'REVIEWED',
        remarks: typeof feedback === 'string' ? feedback : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission reviewed and graded successfully.',
      submission: updated,
    });
  } catch (error: unknown) {
    console.error('Review Submission Error:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission.' },
      { status: 500 }
    );
  }
}