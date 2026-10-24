import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 1. GET: Fetch all teachers belonging to the logged-in center
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    // Safely retrieve user email / id without strict type crashes
    const userEmail = (user as any)?.email;
    const userId = (user as any)?.id || (user as any)?.userId;

    // Identify current branch/center by email or id
    const center = await db.center.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(userId ? [{ id: userId }] : []),
        ],
      },
    });

    const teachers = await db.user.findMany({
      where: {
        role: 'TEACHER',
        ...(center ? { centerId: center.id } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      teachers,
    });
  } catch (error: unknown) {
    console.error('Fetch center teachers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch teachers from database.' },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new Teacher / Faculty account for this center
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Instructor name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Safely retrieve user email / id without strict type crashes
    const userEmail = (user as any)?.email;
    const userId = (user as any)?.id || (user as any)?.userId;

    // Find current center ID
    const center = await db.center.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(userId ? [{ id: userId }] : []),
        ],
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Resilient creation (center link with fallback)
    let newTeacher;
    try {
      newTeacher = await db.user.create({
        data: {
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: 'TEACHER',
          ...(center ? { centerId: center.id } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch {
      newTeacher = await db.user.create({
        data: {
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: 'TEACHER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher credential successfully initialized.',
      teacher: newTeacher,
    });
  } catch (error: unknown) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error creating teacher.' },
      { status: 500 }
    );
  }
}