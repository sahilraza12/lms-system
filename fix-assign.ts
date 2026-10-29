import { db } from '@/lib/db';

async function main() {
  const teacher = await db.teacher.findFirst();
  console.log('Found Teacher:', teacher?.fullName, teacher?.id);

  if (!teacher) {
    console.log('No teacher found in database!');
    return;
  }

  const updated = await db.student.updateMany({
    data: {
      teacherId: teacher.id,
      centerId: teacher.centerId,
    },
  });

  console.log(`Successfully mapped ${updated.count} students to ${teacher.fullName}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());