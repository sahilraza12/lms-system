import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, password, targetRole, profileData } = body;

    if (!email || !otp || !password || !targetRole || !profileData) {
      return NextResponse.json(
        { error: 'Email, OTP, password, targetRole, and profileData are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify OTP
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No verification record found. Please initiate OTP first.' },
        { status: 404 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } });
      return NextResponse.json(
        { error: 'Verification code has expired. Please send a new OTP.' },
        { status: 410 }
      );
    }

    if (otpRecord.otp !== otp.trim()) {
      return NextResponse.json(
        { error: 'Incorrect verification code entered.' },
        { status: 400 }
      );
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Database Transaction: User + Role-specific Profile + Delete OTP
    const result = await prisma.$transaction(async (tx) => {
      // A. Create Core User
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: targetRole,
        },
      });

      // B. Create Role-Specific Profile
      if (targetRole === 'CENTER') {
        const { centerCode, name, authorizedPerson, phone, address } = profileData;
        await tx.center.create({
          data: {
            centerCode,
            name,
            authorizedPerson,
            phone,
            address,
            userId: user.id,
          },
        });
      } else if (targetRole === 'TEACHER') {
        const { teacherCode, fullName, phone, specialization, centerId } = profileData;
        await tx.teacher.create({
          data: {
            teacherCode,
            fullName,
            phone,
            specialization: specialization || null,
            centerId,
            userId: user.id,
          },
        });
      } else if (targetRole === 'STUDENT') {
        const {
          studentCode,
          fullName,
          phone,
          dob,
          gender,
          address,
          centerId,
          courseId,
          teacherId,
        } = profileData;

        await tx.student.create({
          data: {
            studentCode,
            fullName,
            phone,
            dob: new Date(dob),
            gender,
            address,
            centerId,
            courseId,
            teacherId: teacherId || null,
            userId: user.id,
          },
        });
      }

      // C. Delete used OTP
      await tx.otpVerification.delete({
        where: { email: cleanEmail },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: `${targetRole} profile successfully verified and activated.`,
      userId: result.id,
      email: result.email,
      role: result.role,
    });
  } catch (error: unknown) {
    console.error('Onboarding Creation Error:', error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Duplicate entry detected (Code or Email already exists).' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to complete profile creation.',
      },
      { status: 500 }
    );
  }
}