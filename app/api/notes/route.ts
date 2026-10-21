import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Notes fetch karna
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const notes = await db.note.findMany({
      where: courseId ? { courseId } : undefined,
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// Admin/Center ka naya note upload karna
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'CENTER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, fileUrl, courseId } = await req.json();
    if (!title || !fileUrl || !courseId) {
      return NextResponse.json({ error: 'Title, fileUrl, and courseId are required' }, { status: 400 });
    }

    const newNote = await db.note.create({
      data: { title, description, fileUrl, courseId },
    });

    return NextResponse.json({ message: 'Note added successfully', note: newNote });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}