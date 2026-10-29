import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

declare global {
  var __centerOtpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global.__centerOtpStore) {
  global.__centerOtpStore = new Map();
}

const otpStore = global.__centerOtpStore;

// Exact aapke .env file ke names (SMTP_*) ke sath transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Port 587 par STARTTLS ke liye false rehta hai
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s+/g, ''), // Spaces safe remove
  },
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { email, centerCode } = await req.json();

    if (!email || !centerCode) {
      return NextResponse.json({ error: 'Manager official email and center code are required.' }, { status: 400 });
    }

    // 1. Check for existing center code
    const existingCenter = await db.center.findUnique({
      where: { centerCode: centerCode.trim().toUpperCase() },
    });

    if (existingCenter) {
      return NextResponse.json({ error: `Branch Code "${centerCode}" is already registered.` }, { status: 409 });
    }

    // 2. Check for existing user email
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: `An account with email "${email}" already exists.` }, { status: 409 });
    }

    // 3. Generate 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save in storage
    otpStore.set(email.trim().toLowerCase(), { code: otpCode, expiresAt });

    // 4. Send Email directly using SMTP_USER
    await transporter.sendMail({
      from: `"VIQ Technologies" <${process.env.SMTP_USER}>`,
      to: email.trim().toLowerCase(),
      subject: `[VIQ HQ] Security OTP for Center Node ${centerCode.toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; background: #070A0F; color: #f8fafc; padding: 28px; border-radius: 12px; max-width: 460px; margin: auto;">
          <h2 style="color: #f97316; margin-bottom: 8px;">VIQ Technologies</h2>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">Superadmin Franchise Provisioning Verification</p>
          <div style="background: #111827; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #1f2937;">
            <span style="font-size: 11px; color: #94a3b8; font-family: monospace; display: block; letter-spacing: 2px;">6-DIGIT AUTHORIZATION PIN</span>
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f97316; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">Yeh code agle 10 minute tak valid hai. Kripya ise kisi ke sath share na karein.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched directly to ${email}`,
    });
  } catch (error: unknown) {
    console.error('Email dispatch error:', error);
    return NextResponse.json({ error: 'Failed to deliver OTP to the provided email address.' }, { status: 500 });
  }
}