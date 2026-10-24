import { NextResponse } from 'next/server';

declare global {
  var __studentOtpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__studentOtpStore) {
  global.__studentOtpStore = new Map();
}

const otpStore = global.__studentOtpStore;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Valid candidate email is required.' },
        { status: 400 }
      );
    }

    // 6-digit numeric clearance OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifespan

    otpStore.set(email.trim().toLowerCase(), { code: otpCode, expiresAt });

    // Terminal me print hoga verification ke liye
    console.log(`\n=========================================`);
    console.log(`[VIQ CANDIDATE PIN] For: ${email} (${name || 'Candidate'})`);
    console.log(`Clearance Token: ${otpCode}`);
    console.log(`=========================================\n`);

    return NextResponse.json({
      success: true,
      message: `Verification code generated for ${email}`,
    });
  } catch (error: unknown) {
    console.error('Candidate OTP Generation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error generating candidate PIN.' },
      { status: 500 }
    );
  }
}