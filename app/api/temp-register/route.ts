import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email aur password dono zaroori hain.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();

    // Upsert: agar purana record ho toh password reset ho jayega, nahi toh create ho jayega
    const user = await db.user.upsert({
      where: { email: normalizedEmail },
      update: {
        password: hashedPassword,
        role: 'ADMIN' as any,
      },
      create: {
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN' as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account ready ho gaya.',
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Database registration error' },
      { status: 500 }
    );
  }
}