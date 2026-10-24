import { NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required.' },
        { status: 400 }
      );
    }

    const attendanceLogs = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    const totalClasses = attendanceLogs.length;
    const presentClasses = attendanceLogs.filter(
      (log) => log.status === 'PRESENT' || log.status === 'LATE'
    ).length;
    const absentClasses = attendanceLogs.filter(
      (log) => log.status === 'ABSENT'
    ).length;

    const percentage =
      totalClasses > 0
        ? Math.round((presentClasses / totalClasses) * 100)
        : 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
      },
      history: attendanceLogs,
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.error('Attendance Report Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate attendance report.',
      },
      { status: 500 }
    );
  }
}