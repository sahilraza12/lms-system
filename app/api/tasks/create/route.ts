import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, description, dueDate, teacherId } = await req.json();

    if (!title || !description || !teacherId || typeof dueDate !== 'string') {
      return NextResponse.json(
        { error: 'Title, description, teacherId, and submission deadline are required.' },
        { status: 400 }
      );
    }
    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: 'A valid deadline is required.' }, { status: 400 });
    }

    // 1. Verify Teacher exists and is active
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: 'Authorized active teacher account not found.' },
        { status: 404 }
      );
    }

    const assignedStudent = await prisma.student.findFirst({
      where: { teacherId },
      select: { courseId: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!assignedStudent) {
      return NextResponse.json(
        { error: 'Assign a student to this teacher before creating a task.' },
        { status: 400 }
      );
    }

    // 2. Create Task Record
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: parsedDueDate,
        teacherId,
        courseId: assignedStudent.courseId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment successfully published for students.',
      task,
    });
  } catch (error: unknown) {
    console.error('Task Creation Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create assignment task.',
      },
      { status: 500 }
    );
  }
}