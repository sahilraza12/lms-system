import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Helper to resolve current center ID safely
async function resolveCenterId(user: any): Promise<string | null> {
  if (!user) return null;

  if (user.centerId) return user.centerId;

  const userEmail = user.email?.toLowerCase().trim();
  const userId = user.id || user.userId;

  // 1. Center database check
  if (userId) {
    const managedCenter = await db.center.findFirst({
      where: {
        OR: [
          { id: userId },
          { managerId: userId } as any,
          { userId: userId } as any,
        ],
      },
      select: { id: true },
    }).catch(() => null);

    if (managedCenter) return managedCenter.id;
  }

  if (userEmail) {
    const centerByEmail = await db.center.findFirst({
      where: { email: userEmail } as any,
      select: { id: true },
    }).catch(() => null);

    if (centerByEmail) return centerByEmail.id;
  }

  // 2. Fallback: Any active center
  const defaultCenter = await db.center.findFirst({ select: { id: true } });
  return defaultCenter?.id || null;
}

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

    const centerId = await resolveCenterId(user);

    const teacherRecords = await db.teacher.findMany({
      where: centerId ? { centerId } : {},
      include: {
        user: {
          select: { id: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    const formattedTeachers = teacherRecords.map((t) => ({
      id: t.id,
      userId: t.user?.id,
      name: t.fullName,
      fullName: t.fullName,
      email: t.user?.email || '',
      phone: t.phone,
      specialization: t.specialization,
      teacherCode: t.teacherCode,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
    });
  } catch (error: unknown) {
    console.error('Fetch center teachers error:', error);
    return NextResponse.json({
      success: true,
      teachers: [],
    });
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

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const { name, fullName, instructorName, email, password, phone, specialization } = body;
    const teacherFullName = (fullName || name || instructorName || '').trim();

    if (!teacherFullName || !email || !password) {
      return NextResponse.json(
        { error: 'Instructor name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate user
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const centerId = await resolveCenterId(user);
    if (!centerId) {
      return NextResponse.json(
        { error: 'No active center found for this account.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate teacherCode (e.g. TCH-101)
    const teacherCount = await db.teacher.count().catch(() => 0);
    const teacherCode = `TCH-${(teacherCount + 101).toString()}`;

    // Create User with exact matching Teacher fields
    const newTeacherUser = await db.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        role: 'TEACHER',
        teacher: {
          create: {
            teacherCode,
            fullName: teacherFullName,
            phone: phone ? String(phone).trim() : 'N/A', // Schema requires non-nullable String
            specialization: specialization || null,
            isActive: true,
            centerId,
          },
        },
      },
      include: {
        teacher: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Faculty created successfully with code ${teacherCode}.`,
      teacher: {
        id: newTeacherUser.teacher?.id || newTeacherUser.id,
        name: teacherFullName,
        fullName: teacherFullName,
        email: newTeacherUser.email,
        teacherCode,
      },
    });
  } catch (error: unknown) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error creating faculty.' },
      { status: 500 }
    );
  }
}