import { NextResponse } from 'next/server';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Persistent global store across Next.js Turbopack / Route Chunks
const globalForOtp = globalThis as unknown as {
  studentOtpStore?: Map<string, OtpEntry>;
};

export const otpStore =
  globalForOtp.studentOtpStore ?? new Map<string, OtpEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.studentOtpStore = otpStore;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const { email, name } = body as { email?: string; name?: string };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid candidate email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cleanup expired entries periodically to prevent memory leaks
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
      if (value.expiresAt < now) {
        otpStore.delete(key);
      }
    }

    // 6-digit numeric clearance OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes lifespan

    otpStore.set(normalizedEmail, { code: otpCode, expiresAt });

    // Terminal verification output
    console.log(`\n=========================================`);
    console.log(`[VIQ CANDIDATE PIN] For: ${normalizedEmail} (${name || 'Candidate'})`);
    console.log(`Clearance Token: ${otpCode}`);
    console.log(`Expires In: 10 minutes`);
    console.log(`=========================================\n`);

    return NextResponse.json({
      success: true,
      message: `Verification code generated for ${normalizedEmail}`,
    });
  } catch (error: unknown) {
    console.error('Candidate OTP Generation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error generating candidate PIN.' },
      { status: 500 }
    );
  }
}