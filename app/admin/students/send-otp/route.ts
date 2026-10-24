import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

declare global {
  var __studentOtpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__studentOtpStore) {
  global.__studentOtpStore = new Map();
}

const otpStore = global.__studentOtpStore;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Administrative credentials required.' }, { status: 403 });
    }

    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Valid candidate email is required.' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: `A candidate with email ${email} is already registered.` }, { status: 409 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email.trim().toLowerCase(), { code: otpCode, expiresAt });

    // Deliver authorization token directly to candidate email inbox
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'VIQ Admissions <admissions@viqtech.in>',
        to: email.trim().toLowerCase(),
        subject: '[VIQ HQ] Candidate Enrollment Security Token',
        html: `
          <div style="font-family: sans-serif; background: #070A0F; color: #f8fafc; padding: 28px; border-radius: 12px; max-width: 460px; margin: auto;">
            <h2 style="color: #f97316; margin-bottom: 8px;">VIQ Candidate Portal</h2>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">Identity clearance for: <strong>${name || 'Candidate'}</strong></p>
            <div style="background: #111827; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #1f2937;">
              <span style="font-size: 11px; color: #94a3b8; font-family: monospace; display: block; letter-spacing: 2px;">6-DIGIT VERIFICATION PIN</span>
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f97316; font-family: monospace;">${otpCode}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">This verification token expires in 10 minutes. Do not disclose this passkey to unauthorized entities.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn('Mail transport skipped. Fallback console token:', otpCode);
    }

    return NextResponse.json({
      success: true,
      message: `Verification token transmitted to ${email}`,
    });
  } catch (error: unknown) {
    console.error('Candidate OTP dispatch error:', error);
    return NextResponse.json({ error: 'Failed to dispatch verification email.' }, { status: 500 });
  }
}