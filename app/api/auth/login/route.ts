import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import type { TokenPayload } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid login request' }, { status: 400 });
    }

    const { email, password, role } = body as Record<string, unknown>;
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password ||
      (role !== 'student' && role !== 'center' && role !== 'admin')
    ) {
      return NextResponse.json(
        { error: 'Workspace, identifier, and password are required' },
        { status: 400 }
      );
    }

    const identifier = email.trim();
    let user = await db.user.findUnique({
      where: { email: identifier.toLowerCase() },
      include: {
        center: true,
        student: true,
      },
    });

    if (!user && role === 'student') {
      const student = await db.student.findUnique({
        where: { studentCode: identifier.toUpperCase() },
        include: { user: { include: { center: true, student: true } } },
      });
      user = student?.user ?? null;
    } else if (!user && role === 'center') {
      const center = await db.center.findUnique({
        where: { centerCode: identifier.toUpperCase() },
        include: { user: { include: { center: true, student: true } } },
      });
      user = center?.user ?? null;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const roleMatches =
      (role === 'admin' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) ||
      (role === 'center' && user.role === 'CENTER') ||
      (role === 'student' && user.role === 'STUDENT');

    if (!roleMatches) {
      return NextResponse.json(
        { error: 'This account does not belong to the selected workspace' },
        { status: 403 }
      );
    }

    if (user.role === 'CENTER' && user.center && !user.center.isActive) {
      return NextResponse.json(
        { error: 'Your training center account has been suspended or is inactive.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      centerId: user.center?.id || null,
      studentId: user.student?.id || null,
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.center?.name || user.student?.fullName || 'Admin',
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}