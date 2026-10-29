import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const teacher = await db.teacher.findFirst();
  if (!teacher) return NextResponse.json({ error: 'No teacher found' });

  const updated = await db.student.updateMany({
    data: {
      teacherId: teacher.id,
      centerId: teacher.centerId,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Mapped ${updated.count} students to ${teacher.fullName}`,
  });
}