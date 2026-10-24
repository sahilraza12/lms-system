import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId is required.' }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: { teacherId },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                fullName: true,
                studentCode: true,
              },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Fetch Tasks Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch assignments.',
      },
      { status: 500 }
    );
  }
}