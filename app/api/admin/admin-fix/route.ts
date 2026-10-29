import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = 'admin@viqtech.in';
    const plainPassword = 'admin@123'; // temporary password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const admin = await db.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'ADMIN' as any,
      },
      create: {
        email,
        password: hashedPassword,
        role: 'ADMIN' as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin synced in production DB!',
      user: admin.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}