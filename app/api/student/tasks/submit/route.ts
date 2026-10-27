import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Helper: Resolve authenticated student profile safely
async function resolveCurrentStudent() {
  const user = await getCurrentUser();
  if (!user || user.role?.toUpperCase() !== 'STUDENT') {
    return { error: 'Unauthorized: Student login required', status: 401 };
  }

  const currentUserId = (user as any)?.id || (user as any)?.userId;
  const currentUserEmail = (user as any)?.email;
  const currentStudentCode = (user as any)?.studentCode || (user as any)?.identifier;

  const student = await db.student.findFirst({
    where: {
      OR: [
        ...(currentUserId ? [{ userId: currentUserId }, { id: currentUserId }] : []),
        ...(currentUserEmail ? [{ user: { email: currentUserEmail } }] : []),
        ...(currentStudentCode ? [{ studentCode: currentStudentCode }] : []),
      ],
    },
    select: { 
      id: true, 
      courseId: true,
      course: { select: { id: true, title: true } }
    },
  });

  if (!student) {
    return { error: 'Student record not found for this account', status: 404 };
  }

  return { student };
}

// ---------------------------------------------------------------------------
// 1. POST: Task Submission (Supports Links, Supabase Storage Files, Remarks)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const authResult = await resolveCurrentStudent();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { student } = authResult;

    let taskId = '';
    let submissionUrl = '';
    let liveUrl = '';
    let remarks = '';
    const uploadedFileUrls: string[] = [];

    const contentType = req.headers.get('content-type') || '';

    // CASE A: Multipart FormData (Files + Form inputs)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      taskId = String(formData.get('taskId') || '');
      submissionUrl = String(formData.get('submissionUrl') || '');
      liveUrl = String(formData.get('liveUrl') || '');
      remarks = String(formData.get('remarks') || '');

      const files = formData.getAll('files') as File[];
      if (files && files.length > 0) {
        for (const file of files) {
          if (file && file.size > 0 && file.name) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `submissions/${student.id}/${Date.now()}-${sanitizedName}`;

            const { error: uploadError } = await supabaseAdmin.storage
              .from('lms-submissions')
              .upload(filePath, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
              });

            if (uploadError) {
              console.error('Supabase upload error:', uploadError);
              continue;
            }

            const { data: publicUrlData } = supabaseAdmin.storage
              .from('lms-submissions')
              .getPublicUrl(filePath);

            uploadedFileUrls.push(publicUrlData.publicUrl);
          }
        }
      }
    } 
    // CASE B: Direct JSON payload
    else {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
      }
      taskId = String(body.taskId || '');
      submissionUrl = String(body.submissionUrl || '');
      liveUrl = String(body.liveUrl || '');
      remarks = String(body.remarks || '');
      if (Array.isArray(body.fileUrls)) {
        uploadedFileUrls.push(...body.fileUrls);
      }
    }

    taskId = taskId.trim();
    const primaryUrl = (submissionUrl.trim() || liveUrl.trim()) || null;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Verify task exists and is mapped to student's course
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        ...(student.courseId ? { courseId: student.courseId } : {}),
      },
      select: { id: true, title: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Assignment task not found or not allocated to your course.' },
        { status: 404 }
      );
    }

    // Check if an existing submission is present to preserve existing files if no new file is passed
    const existingSubmission = await db.taskSubmission.findUnique({
      where: {
        taskId_studentId: {
          taskId: task.id,
          studentId: student.id,
        },
      },
      select: { fileUrls: true, submissionUrl: true },
    });

    const finalSubmissionUrl = primaryUrl || existingSubmission?.submissionUrl || null;
    const finalFileUrls = uploadedFileUrls.length > 0 
      ? uploadedFileUrls 
      : (existingSubmission?.fileUrls || []);

    if (!finalSubmissionUrl && finalFileUrls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a repository/live link or attach at least one file.' },
        { status: 400 }
      );
    }

    // Upsert submission record matching Prisma schema
    const submission = await db.taskSubmission.upsert({
      where: {
        taskId_studentId: {
          taskId: task.id,
          studentId: student.id,
        },
      },
      update: {
        submissionUrl: finalSubmissionUrl,
        fileUrls: finalFileUrls,
        remarks: remarks.trim() || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        taskId: task.id,
        studentId: student.id,
        submissionUrl: finalSubmissionUrl,
        fileUrls: finalFileUrls,
        remarks: remarks.trim() || null,
        status: 'SUBMITTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully!',
      submission,
    });
  } catch (error: unknown) {
    console.error('Task submission error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// 2. DELETE: Unsubmit / Remove Wrong Submission
// ---------------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const authResult = await resolveCurrentStudent();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { student } = authResult;

    const body = await req.json().catch(() => null);
    const taskId = typeof body?.taskId === 'string' ? body.taskId.trim() : '';
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim() : '';

    if (!taskId && !submissionId) {
      return NextResponse.json(
        { error: 'Task ID or Submission ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.taskSubmission.findFirst({
      where: {
        ...(submissionId ? { id: submissionId } : { taskId, studentId: student.id }),
      },
      select: { id: true, studentId: true, status: true, fileUrls: true },
    });

    if (!existing || existing.studentId !== student.id) {
      return NextResponse.json(
        { error: 'Submission not found or unauthorized' },
        { status: 404 }
      );
    }

    if (existing.status === 'REVIEWED') {
      return NextResponse.json(
        { error: 'Reviewed assignments cannot be unsubmitted.' },
        { status: 400 }
      );
    }

    // Optional: Clean up uploaded files from Supabase bucket to save storage
    if (existing.fileUrls && existing.fileUrls.length > 0) {
      try {
        const filePaths = existing.fileUrls.map((url) => {
          const split = url.split('/lms-submissions/');
          return split.length > 1 ? split[1] : '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
          await supabaseAdmin.storage.from('lms-submissions').remove(filePaths);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup warning on delete:', storageErr);
      }
    }

    // Delete record from PostgreSQL database
    await db.taskSubmission.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment unsubmitted successfully!',
    });
  } catch (error: unknown) {
    console.error('Submission deletion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete submission' },
      { status: 500 }
    );
  }
}