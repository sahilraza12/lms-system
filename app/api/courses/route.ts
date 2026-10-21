import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Saare courses fetch karna (Center & Admin dono ke liye)
export async function GET() {
  try {
    const courses = await db.course.findMany({
      include: {
        _count: {
          select: { students: true, notes: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Fetch courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// Naya course create karna (Super Admin / Admin access only)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { title, description, duration, totalFee } = await req.json();

    if (!title || !duration || totalFee === undefined) {
      return NextResponse.json(
        { error: 'Title, duration, and total fee are required' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        title,
        description: description || '',
        duration,
        totalFee: parseFloat(totalFee),
      },
    });

    return NextResponse.json({
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}