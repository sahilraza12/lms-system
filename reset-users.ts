import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const commonPassword = await bcrypt.hash('Admin@123456', 10);

  console.log('🔄 Resetting passwords for all default roles...');

  // 1. Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@viqtech.in' },
    update: {
      password: commonPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'admin@viqtech.in',
      password: commonPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Super Admin account ready:', admin.email);

  // 2. Center Admin
  const center = await prisma.user.upsert({
    where: { email: 'center.ludhiana@viqtech.in' },
    update: {
      password: commonPassword,
      role: 'CENTER_ADMIN',
    },
    create: {
      email: 'center.ludhiana@viqtech.in',
      password: commonPassword,
      role: 'CENTER_ADMIN',
    },
  });
  console.log('✅ Center Admin account ready:', center.email);

  // 3. Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'mentor.kapoor@viqtech.in' },
    update: {
      password: commonPassword,
      role: 'TEACHER',
    },
    create: {
      email: 'mentor.kapoor@viqtech.in',
      password: commonPassword,
      role: 'TEACHER',
    },
  });
  console.log('✅ Teacher account ready:', teacher.email);

  // 4. Student
  const student = await prisma.user.upsert({
    where: { email: 'sahil.student@viqtech.in' },
    update: {
      password: commonPassword,
      role: 'STUDENT',
    },
    create: {
      email: 'sahil.student@viqtech.in',
      password: commonPassword,
      role: 'STUDENT',
    },
  });
  console.log('✅ Student account ready:', student.email);

  console.log('\n🎉 Passwords for all demo accounts successfully updated to: Admin@123456');
}

main()
  .catch((e) => {
    console.error('❌ Error updating credentials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });