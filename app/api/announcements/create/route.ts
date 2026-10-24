import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNoticeBroadcastEmail } from '@/lib/mail';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const {
      title,
      content,
      scope, // ALL, CENTER, TEACHER_STUDENTS
      senderId,
      senderRole, // ADMIN, SUPER_ADMIN, CENTER_ADMIN, TEACHER
      senderName,
      centerId,
      teacherId,
    } = await req.json();

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
    else if (scope === 'TEACHER_STUDENTS') targetRole = Role.STUDENT;

    // 2. Save Announcement in Database with all schema-required fields
    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        senderId: senderId || 'SYSTEM_ADMIN',
        senderRole: normalizedRole as Role,
        senderName: senderName || 'Academic Office',
        targetRole,
        centerId: centerId || null,
        teacherId: teacherId || null,
      },
    });

    // 3. Determine Target Recipient Emails based on Scope & Role
    let recipientEmails: string[] = [];

    if (scope === 'ALL' && (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN')) {
      // Broadcast to entire institute (Centers, Teachers, Students)
      const users = await db.user.findMany({
        select: { email: true },
      });
      recipientEmails = users.map((u) => u.email);
    } else if (scope === 'CENTER' && centerId) {
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
        ...centerTeachers.map((t) => t.user.email),
        ...centerStudents.map((s) => s.user.email),
      ];
    } else if (scope === 'TEACHER_STUDENTS' && teacherId) {
      // Broadcast only to students assigned to this mentor
      const teacherStudents = await db.student.findMany({
        where: { teacherId },
        include: { user: { select: { email: true } } },
      });
      recipientEmails = teacherStudents.map((s) => s.user.email);
    }

    // Unique non-empty emails list
    const validEmails = Array.from(new Set(recipientEmails.filter(Boolean)));

    // 4. Update sent count
    if (validEmails.length > 0) {
      await db.announcement.update({
        where: { id: announcement.id },
        data: {
          sentCount: validEmails.length,
          emailSent: true,
        },
      });

      // Email dispatch (non-blocking)
      sendNoticeBroadcastEmail({
        toEmails: validEmails,
        title,
        content,
        senderName: senderName || 'Academic Office',
        senderRole: normalizedRole,
      }).catch((err) => console.error('Broadcast email delivery failure:', err));
    }

    return NextResponse.json({
      success: true,
      message: `Circular published and dispatched to ${validEmails.length} recipients.`,
      announcement,
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