import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // 2. Generate 6-digit OTP & 10 minutes expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Upsert OTP in database
    await prisma.otpVerification.upsert({
      where: { email: cleanEmail },
      update: {
        otp,
        expiresAt,
      },
      create: {
        email: cleanEmail,
        otp,
        expiresAt,
      },
    });

    // 4. Send email
    await sendOtpEmail(cleanEmail, otp);

    return NextResponse.json({
      success: true,
      message: 'One-time verification code has been dispatched to your email.',
    });
  } catch (error: unknown) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to dispatch verification email.',
      },
      { status: 500 }
    );
  }
}