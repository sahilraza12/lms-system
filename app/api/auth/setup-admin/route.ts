import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// 1. GET: Check karega ki admin already exist karta hai ya nahi
export async function GET() {
  try {
    const adminExists = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    return NextResponse.json({
      setupAllowed: !adminExists,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Sirf tab create karega agar 0 admin ho
export async function POST(req: Request) {
  try {
    // Double-check: Agar already koi ADMIN hai to foran block kar do
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'System already initialized. Initial admin creation is locked permanently.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rootAdmin = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Initial SuperAdmin account created successfully. System locked.',
      user: rootAdmin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initialize system.' },
      { status: 500 }
    );
  }
}