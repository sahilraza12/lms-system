import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Fetch all announcements (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target');

    const announcements = await db.announcement.findMany({
      where: target ? { target: { in: ['ALL', target] } } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new announcement (POST)
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { title, content, target } = body as Record<string, unknown>;

    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (target !== undefined && !['ALL', 'CENTER', 'STUDENT'].includes(String(target))) {
      return NextResponse.json({ error: 'Invalid announcement target' }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        target: typeof target === 'string' ? target : 'ALL',
      },
    });

    return NextResponse.json({ announcement, message: 'Notice published successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to publish notice' }, { status: 500 });
  }
}