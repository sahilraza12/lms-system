import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Tasks fetch karna
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const tasks = await db.task.findMany({
      where: courseId ? { courseId } : undefined,
      include: { course: { select: { title: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// Admin/Center ka task assign karna
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'CENTER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, dueDate, courseId } = await req.json();
    if (!title || !dueDate || !courseId) {
      return NextResponse.json({ error: 'Title, dueDate, and courseId are required' }, { status: 400 });
    }

    const newTask = await db.task.create({
      data: {
        title,
        description: description || '',
        dueDate: new Date(dueDate),
        courseId,
      },
    });

    return NextResponse.json({ message: 'Task assigned successfully', task: newTask });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}