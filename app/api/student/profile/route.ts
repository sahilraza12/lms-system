import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access only' }, { status: 401 });
    }

    // Safely support both userId or id from session token
    const userId = (user as { userId?: string; id?: string }).userId || (user as { userId?: string; id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Pehle student record retrieve karein
    const studentInfo = await db.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!studentInfo) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Student profile with notes, tasks and this student's specific task submissions
    const student = await db.student.findUnique({
      where: { id: studentInfo.id },
      include: {
        center: { select: { name: true, phone: true } },
        course: {
          include: {
            notes: { orderBy: { createdAt: 'desc' } },
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
            installments: { orderBy: { dueDate: 'asc' } },
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        certificates: true,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Fetch student profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}