import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper: Resilient Teacher Resolution
async function resolveTeacher(user: any) {
  if (!user || user.role?.toUpperCase() !== 'TEACHER') {
    return null;
  }

  const currentTeacherId = user.teacherId;
  const currentUserId = user.id || user.userId;

  const teacher = await db.teacher.findFirst({
    where: {
      OR: [
        ...(currentTeacherId ? [{ id: currentTeacherId }] : []),
        ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
      ],
    },
    select: { id: true, isActive: true },
  });

  return teacher && teacher.isActive ? teacher : null;
}

// 1. Fetch all assignments created by the mentor with student submissions
export async function GET() {
  try {
    const user = await getCurrentUser();
    const teacher = await resolveTeacher(user);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile required.' },
        { status: 403 }
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
    const teacher = await resolveTeacher(user);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile required.' },
        { status: 403 }
      );
    }

    const body: unknown = await req.json().catch(() => null);
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

    // Fallback: Agar specific assigned student na ho toh system ka pehla course attach karo
    let targetCourseId = assignedStudent?.courseId;
    if (!targetCourseId) {
      const defaultCourse = await db.course.findFirst({ select: { id: true } });
      targetCourseId = defaultCourse?.id;
    }

    if (!targetCourseId) {
      return NextResponse.json(
        { error: 'No active course tracks found to assign tasks to.' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        dueDate: parsedDueDate,
        teacherId: teacher.id,
        courseId: targetCourseId,
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

// 3. Review & Grade a submission
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    const teacher = await resolveTeacher(user);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile required.' },
        { status: 403 }
      );
    }

    const body: unknown = await req.json().catch(() => null);
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

// 4. DELETE: Safely remove a coursework task & its submissions
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    const teacher = await resolveTeacher(user);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized: Active teacher profile required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required for deletion.' },
        { status: 400 }
      );
    }

    // Verify task ownership
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        teacherId: teacher.id,
      },
      select: { id: true, title: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or not created by your mentor account.' },
        { status: 404 }
      );
    }

    // Cascade deletion inside transaction
    await db.$transaction(async (tx) => {
      // 1. Delete associated submissions
      await tx.taskSubmission.deleteMany({
        where: { taskId: task.id },
      });

      // 2. Delete task
      await tx.task.delete({
        where: { id: task.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" has been deleted successfully.`,
    });
  } catch (error: unknown) {
    console.error('Delete Task Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coursework task.' },
      { status: 500 }
    );
  }
}