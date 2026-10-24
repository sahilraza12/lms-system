import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only' },
        { status: 401 }
      );
    }

    // Session token se userId retrieve karein
    const userId =
      (user as { userId?: string; id?: string }).userId ||
      (user as { userId?: string; id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Pehle verified student profile record retrieve karein
    const studentInfo = await db.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!studentInfo) {
      return NextResponse.json(
        { error: 'Student record not found for this account' },
        { status: 404 }
      );
    }

    // Student profile with notes, tasks, candidate-specific lab submissions, fee plan & certificates
    const student = await db.student.findUnique({
      where: { id: studentInfo.id },
      include: {
        center: {
          select: {
            id: true,
            name: true,
            centerCode: true,
            phone: true,
            address: true,
          },
        },
        course: {
          include: {
            notes: {
              orderBy: { createdAt: 'desc' },
            },
            tasks: {
              orderBy: { dueDate: 'asc' },
              include: {
                submissions: {
                  where: { studentId: studentInfo.id },
                },
              },
            },
          },
        },
        feePlan: {
          include: {
            installments: {
              orderBy: { dueDate: 'asc' },
            },
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
        certificates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: unknown) {
    console.error('Fetch student profile error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch student profile',
      },
      { status: 500 }
    );
  }
}