import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const email = 'admin@viqtech.in'.toLowerCase();
    const plainPassword = 'admin@123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Login route ke strict check ke hisaab se role exact 'ADMIN' hona chahiye
    const adminUser = await db.user.upsert({
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

    // Login route jaisa hi bcrypt verification test
    const isValid = await bcrypt.compare(plainPassword, adminUser.password);

    return NextResponse.json({
      success: true,
      email: adminUser.email,
      role: adminUser.role,
      bcryptTestPassed: isValid,
      message: 'Account is ready. Now go to /login and use password: admin',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}