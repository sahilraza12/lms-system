import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email, targetRole, creatorRole } = await req.json();

    if (!email || !targetRole || !creatorRole) {
      return NextResponse.json(
        { error: 'Email, targetRole, and creatorRole are mandatory.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Role Authorization Check
    // Admin can create Center. Center can create Teacher or Student.
    if (targetRole === 'CENTER' && !['SUPER_ADMIN', 'ADMIN'].includes(creatorRole)) {
      return NextResponse.json(
        { error: 'Only Admins can onboard a new Training Center.' },
        { status: 403 }
      );
    }

    if (['TEACHER', 'STUDENT'].includes(targetRole) && creatorRole !== 'CENTER') {
      return NextResponse.json(
        { error: 'Only Centers can onboard Teachers or Students.' },
        { status: 403 }
      );
    }

    // 2. Check if email already registered in system
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `An account with ${cleanEmail} is already active in the system.` },
        { status: 409 }
      );
    }

    // 3. Generate 6-digit OTP (10 mins valid)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save/Update OTP in OtpVerification table
    await prisma.otpVerification.upsert({
      where: { email: cleanEmail },
      update: { otp, expiresAt },
      create: { email: cleanEmail, otp, expiresAt },
    });

    // 5. Send Email to targeted invitee
    await sendOtpEmail(cleanEmail, otp);

    return NextResponse.json({
      success: true,
      message: `Verification OTP dispatched to ${cleanEmail} for ${targetRole} activation.`,
    });
  } catch (error: unknown) {
    console.error('Send Onboarding OTP Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to dispatch onboarding code.',
      },
      { status: 500 }
    );
  }
}