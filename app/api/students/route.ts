import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminScope = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isCenterScope = user.role === 'CENTER';

    const students = await db.student.findMany({
      where: isAdminScope
        ? {}
        : isCenterScope
          ? { centerId: user.centerId ?? undefined }
          : { id: user.studentId ?? undefined },
      include: {
        user: { select: { email: true } },
        center: true,
        course: true,
        feePlan: { include: { installments: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'CENTER') {
      return NextResponse.json({ error: 'Unauthorized: Center access only' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      password,
      studentCode,
      phone,
      dob,
      gender,
      address,
      courseId,
      totalAmount,
    } = body ?? {};

    if (!fullName || !email || !password || !studentCode || !courseId || totalAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingStudent = await db.student.findUnique({ where: { studentCode } });
    if (existingStudent) {
      return NextResponse.json({ error: 'Student code already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            fullName,
            studentCode,
            phone: phone || '',
            dob: dob ? new Date(dob) : new Date('2000-01-01'),
            gender: gender || 'Not Specified',
            address: address || '',
            centerId: user.centerId ?? '',
            courseId,
          },
        },
      },
      include: { student: true },
    });

    const createdStudent = student.student;

    if (!createdStudent) {
      return NextResponse.json({ error: 'Student could not be created' }, { status: 500 });
    }

    const feePlanTotal = Number(totalAmount) || 0;
    await db.feePlan.create({
      data: {
        studentId: createdStudent.id,
        totalAmount: feePlanTotal,
        paidAmount: 0,
        balance: feePlanTotal,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Student created successfully',
      student: createdStudent,
    });
  } catch (error) {
    console.error('Register student error:', error);
    return NextResponse.json({ error: 'Failed to register student' }, { status: 500 });
  }
}
