import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNoticeBroadcastEmail } from '@/lib/mail';
import { NoticePriority, Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid announcement request payload.' },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      scope, // ALL, CENTER, TEACHER_STUDENTS, STUDENTS
      senderId,
      senderRole, // ADMIN, SUPER_ADMIN, CENTER_ADMIN, TEACHER
      senderName,
      centerId,
      teacherId,
      priority,
      isPinned,
    } = body;

    if (!title || !content || !senderRole) {
      return NextResponse.json(
        { error: 'Title, content, and senderRole are required.' },
        { status: 400 }
      );
    }

    // Role mapping for safety
    const normalizedRole = senderRole === 'CENTER' ? 'CENTER_ADMIN' : senderRole;

    // 1. Map incoming scope to targetRole enum
    let targetRole: Role | null = null;
    if (scope === 'CENTER') targetRole = Role.CENTER_ADMIN;
    else if (scope === 'TEACHER_STUDENTS' || scope === 'STUDENTS') targetRole = Role.STUDENT;
    else if (scope === 'TEACHERS') targetRole = Role.TEACHER;

    // 2. Safe Priority mapping
    const computedPriority =
      priority === 'URGENT' || isPinned === true
        ? NoticePriority.URGENT
        : NoticePriority.NORMAL;

    // Build resilient announcement payload
    const createData: Record<string, any> = {
      title: title.trim(),
      content: content.trim(),
      priority: computedPriority,
      senderId: senderId || undefined,
      senderRole: (normalizedRole as Role) || Role.ADMIN,
      senderName: senderName || 'Central Academic Office',
      targetRole,
      centerId: centerId && centerId !== 'ALL' ? centerId : null,
    };

    // Attach teacherId only if validly provided
    if (teacherId && teacherId !== 'ALL') {
      createData.teacherId = teacherId;
    }

    // 2. Save Announcement in Database
    const announcement = await db.announcement.create({
      data: createData as any,
    });

    // 3. Determine Target Recipient Emails based on Scope & Role
    let recipientEmails: string[] = [];

    if (scope === 'ALL' && (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN')) {
      // Broadcast to entire institute (Centers, Teachers, Students)
      const users = await db.user.findMany({
        select: { email: true },
      });
      recipientEmails = users.map((u) => u.email);
    } else if (scope === 'CENTER' && centerId && centerId !== 'ALL') {
      // Broadcast to all teachers and students of this center
      const [centerTeachers, centerStudents] = await Promise.all([
        db.teacher.findMany({
          where: { centerId, isActive: true },
          include: { user: { select: { email: true } } },
        }),
        db.student.findMany({
          where: { centerId },
          include: { user: { select: { email: true } } },
        }),
      ]);

      recipientEmails = [
        ...centerTeachers.map((t) => t.user?.email).filter(Boolean),
        ...centerStudents.map((s) => s.user?.email).filter(Boolean),
      ] as string[];
    } else if (scope === 'TEACHER_STUDENTS' && teacherId) {
      // Broadcast only to students assigned to this mentor
      const teacherStudents = await db.student.findMany({
        where: { teacherId },
        include: { user: { select: { email: true } } },
      });
      recipientEmails = teacherStudents.map((s) => s.user?.email).filter(Boolean) as string[];
    } else {
      // Default fallback: Target students if scope is student oriented
      if (targetRole === Role.STUDENT) {
        const students = await db.student.findMany({
          include: { user: { select: { email: true } } },
        });
        recipientEmails = students.map((s) => s.user?.email).filter(Boolean) as string[];
      }
    }

    // Unique non-empty verified emails list
    const validEmails = Array.from(new Set(recipientEmails.filter((e) => typeof e === 'string' && e.includes('@'))));

    // 4. Update sent count & asynchronous dispatch
    if (validEmails.length > 0) {
      // Optional schema field guard
      await db.announcement
        .update({
          where: { id: announcement.id },
          data: {
            sentCount: validEmails.length,
            emailSent: true,
          } as any,
        })
        .catch(() => {
          // Graceful fallback if sentCount/emailSent are not in model
        });

      // Email dispatch (non-blocking)
      sendNoticeBroadcastEmail({
        toEmails: validEmails,
        title: title.trim(),
        content: content.trim(),
        senderName: senderName || 'Academic Office',
        senderRole: normalizedRole,
      }).catch((err) => console.error('Broadcast email delivery failure:', err));
    }

    return NextResponse.json({
      success: true,
      message: `Circular published and dispatched to ${validEmails.length} recipients.`,
      announcement: {
        ...announcement,
        isPinned: announcement.priority === NoticePriority.URGENT,
      },
      recipientsDispatched: validEmails.length,
    });
  } catch (error: unknown) {
    console.error('Create Announcement Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to dispatch notice.',
      },
      { status: 500 }
    );
  }
}