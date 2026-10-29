import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function isAdmin(role: string) {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

// 1. Fetch All Centers with aggregate metrics
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [centers, feePlans] = await Promise.all([
      db.center.findMany({
        include: {
          user: { select: { email: true } },
          _count: {
            select: {
              teachers: true,
              students: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.feePlan.findMany({
        select: {
          paidAmount: true,
          student: { select: { centerId: true } },
        },
      }),
    ]);

    const collectedByCenter = new Map<string, number>();
    feePlans.forEach((plan) => {
      collectedByCenter.set(
        plan.student.centerId,
        (collectedByCenter.get(plan.student.centerId) ?? 0) + plan.paidAmount
      );
    });

    return NextResponse.json({
      success: true,
      centers: centers.map((center) => ({
        ...center,
        totalCollected: collectedByCenter.get(center.id) ?? 0,
      })),
    });
  } catch (error: unknown) {
    console.error('Fetch Centers Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch centers.' },
      { status: 500 }
    );
  }
}

// 2. Create New Training Center & Branch Head User
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const centerCode =
      typeof input.centerCode === 'string'
        ? input.centerCode.trim().toUpperCase()
        : '';
    const email =
      typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const address = typeof input.address === 'string' ? input.address.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const authorizedPerson =
      typeof input.authorizedPerson === 'string'
        ? input.authorizedPerson.trim()
        : '';
    const royaltyRate = input.royaltyRate === undefined ? 25 : input.royaltyRate;

    if (!name || !centerCode || !email || !password) {
      return NextResponse.json(
        { error: 'Name, center code, email, and password are required.' },
        { status: 400 }
      );
    }
    if (
      typeof royaltyRate !== 'number' ||
      !Number.isInteger(royaltyRate) ||
      royaltyRate < 0 ||
      royaltyRate > 100
    ) {
      return NextResponse.json(
        { error: 'Royalty rate must be a whole number between 0 and 100.' },
        { status: 400 }
      );
    }
    if (name.length > 120 || centerCode.length > 40 || email.length > 254) {
      return NextResponse.json(
        { error: 'One or more fields exceed the maximum allowed length.' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (phone.length > 40 || authorizedPerson.length > 120 || address.length > 500) {
      return NextResponse.json(
        { error: 'One or more fields exceed the maximum allowed length.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.CENTER_ADMIN,
        },
      });

      const center = await tx.center.create({
        data: {
          name,
          centerCode,
          authorizedPerson: authorizedPerson || name,
          phone: phone || 'Not Provided',
          address: address || 'Address not specified',
          royaltyRate,
          userId: user.id,
        },
      });

      return { user, center };
    });

    return NextResponse.json({
      success: true,
      message: 'Training center onboarded successfully.',
      center: result.center,
    });
  } catch (error: unknown) {
    console.error('Create Center Error:', error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A user with this email or center code already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? 'Invalid request body.'
            : 'Failed to create training center.',
      },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}