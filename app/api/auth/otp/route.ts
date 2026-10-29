import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

declare global {
  var __studentOtpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__studentOtpStore) {
  global.__studentOtpStore = new Map();
}

const studentOtpStore = global.__studentOtpStore;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
  },
});

// Verification logic handler
async function handleVerification(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid verification payload.' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const otp = (body.otp || body.code)?.toString().trim();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and 6-digit OTP code are required.' }, { status: 400 });
    }

    const record = studentOtpStore.get(email);

    if (!record) {
      return NextResponse.json(
        { error: 'No OTP requested for this email or OTP expired. Please click Send OTP again.' },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      studentOtpStore.delete(email);
      return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
    }

    if (record.code !== otp) {
      return NextResponse.json({ error: 'Incorrect verification code. Please check your inbox.' }, { status: 400 });
    }

    // OTP Verified! Clean up store
    studentOtpStore.delete(email);

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Student email verified successfully.',
    });
  } catch (error: unknown) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal verification failure.' },
      { status: 500 }
    );
  }
}

// 1. POST: Handles both Send OTP and Verify OTP (action/mode flag)
export async function POST(req: Request) {
  try {
    const clone = req.clone();
    const body = await clone.json().catch(() => ({}));

    // Agar frontend POST method se verify kar raha hai (action === 'VERIFY' ya body me otp/code present hai)
    if (body.action === 'VERIFY' || (body.otp && body.email) || (body.code && body.email)) {
      return handleVerification(req);
    }

    // Varna SEND OTP logic
    const { email } = body;
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid student email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    studentOtpStore.set(cleanEmail, { code: otpCode, expiresAt });

    await transporter.sendMail({
      from: `"VIQ Academic Desk" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: `[VIQ Admission] Student Verification OTP: ${otpCode}`,
      html: `
        <div style="font-family: sans-serif; background: #070A0F; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 480px; margin: auto;">
          <h2 style="color: #f97316; margin-bottom: 6px;">VIQ Technologies</h2>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">Student Admission Verification</p>
          <div style="background: #111827; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #1f2937;">
            <span style="font-size: 11px; color: #94a3b8; font-family: monospace; display: block; letter-spacing: 2px;">YOUR 6-DIGIT ADMISSION CODE</span>
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f97316; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This OTP is valid for 10 minutes. Use it to confirm at the center admission desk.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `OTP successfully sent to ${cleanEmail}`,
    });
  } catch (error: unknown) {
    console.error('Student OTP Dispatch Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to dispatch OTP.' },
      { status: 500 }
    );
  }
}

// 2. PUT: Agar frontend PUT method se verification trigger kar raha ho
export async function PUT(req: Request) {
  return handleVerification(req);
}

// 3. PATCH: Agar frontend PATCH method use kar raha ho
export async function PATCH(req: Request) {
  return handleVerification(req);
}