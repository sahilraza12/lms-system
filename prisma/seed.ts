import { PrismaClient, Role, FeeType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial LMS dataset...');

  // Common Password for Demo Accounts
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Super Admin Account
  await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@lms.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✓ Super Admin created: admin@lms.com`);

  // 2. Default Training Center
  const centerUser = await prisma.user.upsert({
    where: { email: 'center@apexskills.com' },
    update: {},
    create: {
      email: 'center@apexskills.com',
      password: hashedPassword,
      role: Role.CENTER,
    },
  });

  const center = await prisma.center.upsert({
    where: { centerCode: 'CTR-101' },
    update: { isActive: true, userId: centerUser.id },
    create: {
      centerCode: 'CTR-101',
      name: 'Apex Skills Training Institute',
      authorizedPerson: 'Rajesh Sharma',
      phone: '9876543210',
      address: 'Main Commercial Complex, Sector 14',
      isActive: true,
      userId: centerUser.id,
    },
  });
  console.log(`✓ Training Center created: ${center.name} (${center.centerCode})`);

  // 3. Standard Courses Catalog
  const webDevCourse = await prisma.course.upsert({
    where: { id: 'course-fullstack-web' },
    update: {},
    create: {
      id: 'course-fullstack-web',
      title: 'Full Stack Web Development (MERN)',
      description: 'Comprehensive program covering React, Node.js, Next.js, PostgreSQL, and Cloud Deployment.',
      duration: '6 Months',
      totalFee: 25000,
    },
  });

  const aiMlCourse = await prisma.course.upsert({
    where: { id: 'course-ai-data' },
    update: {},
    create: {
      id: 'course-ai-data',
      title: 'Applied AI & Data Engineering',
      description: 'Hands-on training in Python, Machine Learning models, Prompt Engineering, and RAG architectures.',
      duration: '6 Months',
      totalFee: 30000,
    },
  });
  console.log(`✓ Courses registered: ${webDevCourse.title}, ${aiMlCourse.title}`);

  // 4. Study Notes & Reference Material
  await prisma.note.createMany({
    data: [
      {
        title: 'Module 1: React.js Architecture & State Management',
        description: 'Complete reference slides and code patterns for Hooks, Redux, and Context API.',
        fileUrl: 'https://example.com/materials/react-module-1.pdf',
        courseId: webDevCourse.id,
      },
      {
        title: 'Module 2: PostgreSQL & Prisma ORM Schema Design',
        description: 'Relational database normalization guides and indexing best practices.',
        fileUrl: 'https://example.com/materials/prisma-database.pdf',
        courseId: webDevCourse.id,
      },
    ],
    skipDuplicates: true,
  });

  // 5. Assignments & Tasks
  const taskDueDate = new Date();
  taskDueDate.setDate(taskDueDate.getDate() + 14); // 2 weeks from now

  await prisma.task.create({
    data: {
      title: 'Capstone Project: Build an Auth API with JWT',
      description: 'Implement login, register, and refresh token endpoints with secure HTTP-only cookies.',
      dueDate: taskDueDate,
      courseId: webDevCourse.id,
    },
  });
  console.log(`✓ Notes and Tasks seeded`);

  // 6. Demo Student Account with Fee & EMI Plan
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: hashedPassword,
      role: Role.STUDENT,
    },
  });

  const student = await prisma.student.upsert({
    where: { studentCode: 'STU-1001' },
    update: {},
    create: {
      studentCode: 'STU-1001',
      fullName: 'Aman Verma',
      phone: '9123456780',
      dob: new Date('2003-05-15'),
      gender: 'Male',
      address: 'House #42, Model Town',
      userId: studentUser.id,
      centerId: center.id,
      courseId: webDevCourse.id,
    },
  });

  // EMI Fee Plan for Student
  const feePlan = await prisma.feePlan.upsert({
    where: { studentId: student.id },
    update: {},
    create: {
      studentId: student.id,
      type: FeeType.EMI,
      totalAmount: 25000,
      paidAmount: 10000,
      balance: 15000,
      status: PaymentStatus.PARTIAL,
    },
  });

  // Installment 1 (Paid)
  const d1 = new Date();
  d1.setMonth(d1.getMonth() - 1);
  await prisma.installment.create({
    data: {
      feePlanId: feePlan.id,
      dueDate: d1,
      amount: 10000,
      status: PaymentStatus.PAID,
      paidAt: d1,
    },
  });

  // Installment 2 (Overdue demo)
  const d2 = new Date();
  d2.setDate(d2.getDate() - 5);
  await prisma.installment.create({
    data: {
      feePlanId: feePlan.id,
      dueDate: d2,
      amount: 7500,
      status: PaymentStatus.PENDING,
    },
  });

  // Installment 3 (Future)
  const d3 = new Date();
  d3.setDate(d3.getDate() + 25);
  await prisma.installment.create({
    data: {
      feePlanId: feePlan.id,
      dueDate: d3,
      amount: 7500,
      status: PaymentStatus.PENDING,
    },
  });

  // Initial Payment Voucher
  await prisma.payment.create({
    data: {
      feePlanId: feePlan.id,
      amount: 10000,
      mode: 'ONLINE',
      paymentDate: d1,
    },
  });

  console.log(`✓ Demo Student & EMI Schedule seeded: Aman Verma (STU-1001)`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });