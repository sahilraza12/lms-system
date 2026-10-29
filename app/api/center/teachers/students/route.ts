import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let targetTeacherId = searchParams.get('teacherId');

    const currentUser = await getCurrentUser();

    // 1. Agar query param me id nahi hai, to logged-in teacher ki profile nikalen
    if (!targetTeacherId && currentUser) {
      const currentUserId = (currentUser as any).id || (currentUser as any).userId;
      const currentUserEmail = (currentUser as any).email;

      const teacherProfile = await db.teacher.findFirst({
        where: {
          OR: [
            ...(currentUserId ? [{ userId: currentUserId }] : []),
            ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
          ],
        },
        select: { id: true },
      });

      if (teacherProfile) {
        targetTeacherId = teacherProfile.id;
      }
    }

    // 2. Agar query param me user ID aayi ho, to use Teacher table ki ID se match karen
    if (targetTeacherId) {
      const teacherCheck = await db.teacher.findFirst({
        where: {
          OR: [
            { id: targetTeacherId },
            { userId: targetTeacherId },
          ],
        },
        select: { id: true },
      });

      if (teacherCheck) {
        targetTeacherId = teacherCheck.id;
      }
    }

    if (!targetTeacherId) {
      return NextResponse.json(
        { error: 'Teacher profile identification missing or unauthorized.' },
        { status: 400 }
      );
    }

    // 3. Teacher ke assigned students fetch karna (Prisma safe fields)
    const students = await db.student.findMany({
      where: {
        teacherId: targetTeacherId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            durationMonths: true,
            fee: true,
          } as any,
        },
        center: {
          select: {
            id: true,
            name: true,
            centerCode: true,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Clean frontend response mapping
    const formattedStudents = students.map((s: any) => ({
      id: s.id,
      studentCode: s.studentCode,
      fullName: s.fullName,
      email: s.user?.email || '',
      phone: s.phone || '',
      dob: s.dob,
      gender: s.gender,
      address: s.address,
      course: s.course
        ? {
            id: s.course.id,
            title: s.course.title,
            courseCode: s.course.courseCode,
            duration: s.course.durationMonths ? `${s.course.durationMonths} Months` : 'N/A',
            fee: s.course.fee,
          }
        : null,
      center: s.center
        ? {
            id: s.center.id,
            name: s.center.name,
            code: s.center.centerCode,
          }
        : null,
      feePlan: s.feePlan
        ? {
            totalAmount: s.feePlan.totalAmount,
            paidAmount: s.feePlan.paidAmount,
            balance: s.feePlan.balance,
            status: s.feePlan.status,
            installments: s.feePlan.installments || [],
            payments: s.feePlan.payments || [],
          }
        : null,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (error: unknown) {
    console.error('Fetch Teacher Assigned Students Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch assigned students from database.',
      },
      { status: 500 }
    );
  }
}