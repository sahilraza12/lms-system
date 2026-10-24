import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { studentId, teacherId } = body;
    let centerId = body.centerId;

    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: 'studentId and teacherId are required.' },
        { status: 400 }
      );
    }

    // Authenticated Center ID resolve karein (agar body me na ho ya manipulate ki gayi ho)
    const currentUserId = (user as any)?.id || (user as any)?.userId;
    const currentUserEmail = (user as any)?.email;

    if (!centerId) {
      const centerRecord = await db.center.findFirst({
        where: {
          OR: [
            ...(currentUserId ? [{ id: currentUserId }] : []),
            ...(currentUserId ? [{ userId: currentUserId }] : []),
            ...(currentUserEmail ? [{ email: currentUserEmail }] : []),
          ],
        },
        select: { id: true },
      });
      centerId = centerRecord?.id || (user as any)?.centerId;
    }

    if (!centerId) {
      return NextResponse.json(
        { error: 'Active center context not found.' },
        { status: 403 }
      );
    }

    // 1. Verify Teacher isi Center ka part hai (Teacher model ya User role TEACHER)
    const client: any = db;
    let verifiedTeacher: any = null;

    try {
      verifiedTeacher = await client.teacher.findFirst({
        where: {
          id: teacherId,
          ...(centerId ? { centerId } : {}),
        },
      });
    } catch {
      // Fallback: check User table
      verifiedTeacher = await client.user.findFirst({
        where: {
          id: teacherId,
          role: 'TEACHER',
          ...(centerId ? { centerId } : {}),
        },
      });
    }

    if (!verifiedTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found or unauthorized for this center.' },
        { status: 404 }
      );
    }

    // 2. Student usi Center me enrolled hai ya nahi check karein
    const student = await client.student.findFirst({
      where: {
        id: studentId,
        ...(centerId ? { centerId } : {}),
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found in this center node.' },
        { status: 404 }
      );
    }

    // 3. Assign / Update Teacher
    const updatedStudent = await client.student.update({
      where: { id: studentId },
      data: { teacherId: verifiedTeacher.id },
      include: {
        user: { select: { email: true, name: true } },
        course: { select: { title: true } },
        assignedTeacher: {
          select: {
            id: true,
            fullName: true,
            teacherCode: true,
            specialization: true,
          },
        },
      },
    });

    const teacherDisplayName =
      verifiedTeacher.fullName || verifiedTeacher.name || 'Assigned Faculty';

    return NextResponse.json({
      success: true,
      message: `Student successfully assigned to mentor ${teacherDisplayName}.`,
      student: updatedStudent,
    });
  } catch (error: unknown) {
    console.error('Assign Student Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to assign mentor to student.',
      },
      { status: 500 }
    );
  }
}