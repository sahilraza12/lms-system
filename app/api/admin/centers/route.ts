import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 1. Fetch all centers
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const centers = await db.center.findMany({
      include: {
        user: {
          select: { email: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ centers });
  } catch (error) {
    console.error('Fetch centers error:', error);
    return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 });
  }
}

// 2. Create new center with login credentials
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, centerCode, email, password, authorizedPerson, phone, address } = body;

    if (!name || !centerCode || !email || !password || !authorizedPerson || !phone) {
      return NextResponse.json(
        { error: 'All essential fields are required' },
        { status: 400 }
      );
    }

    // Check if email or center code already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingCode = await db.center.findUnique({ where: { centerCode } });
    if (existingCode) {
      return NextResponse.json({ error: 'Center code already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and center in a transaction
    const newCenter = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CENTER',
        center: {
          create: {
            name,
            centerCode,
            authorizedPerson,
            phone,
            address: address || '',
            isActive: true,
          },
        },
      },
      include: {
        center: true,
      },
    });

    return NextResponse.json({
      message: 'Center created successfully',
      center: newCenter.center,
    });
  } catch (error) {
    console.error('Create center error:', error);
    return NextResponse.json({ error: 'Failed to create center' }, { status: 500 });
  }
}