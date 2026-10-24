import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized: Student access only.' },
        { status: 401 },
      );
    }

    const student = user.studentId
      ? await prisma.student.findUnique({
          where: { id: user.studentId },
          select: { id: true, teacherId: true, courseId: true },
        })
      : await prisma.student.findUnique({
          where: { userId: user.userId },
          select: { id: true, teacherId: true, courseId: true },
        });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile is not configured.' },
        { status: 403 },
      );
    }
    if (!student.teacherId) {
      return NextResponse.json({
        success: true,
        tasks: [],
        message: 'No mentor assigned yet.',
      });
    }

    // 2. Us teacher ke saare tasks fetch karein sath hi is student ka submission status
    const tasks = await prisma.task.findMany({
      where: { teacherId: student.teacherId, courseId: student.courseId },
      include: {
        submissions: {
          where: { studentId: student.id },
          select: {
            id: true,
            submissionUrl: true,
            fileUrls: true,
            remarks: true,
            submittedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task) => ({
        ...task,
        submissions: task.submissions.map((submission) => ({
          ...submission,
          fileUrl: submission.submissionUrl ?? submission.fileUrls[0] ?? '',
        })),
      })),
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Fetch Student Tasks Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student tasks.' },
      { status: 500 }
    );
  }
}