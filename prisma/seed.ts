import 'dotenv/config';
import {
  PrismaClient,
  Role,
  FeeType,
  PaymentStatus,
  AttendanceStatus,
  TaskSubmissionStatus,
  NoticePriority,
  CertificateStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed data must not be applied to a production database.');
  }

  console.log('🌱 Starting comprehensive database seed for Multi-Tenant LMS...');

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) {
    throw new Error('Set SEED_PASSWORD before seeding demo accounts.');
  }
  const resetExistingPasswords = process.env.SEED_RESET_PASSWORDS === 'true';
  if (
    process.env.SEED_RESET_PASSWORDS &&
    process.env.SEED_RESET_PASSWORDS !== 'true' &&
    process.env.SEED_RESET_PASSWORDS !== 'false'
  ) {
    throw new Error('SEED_RESET_PASSWORDS must be either "true" or "false".');
  }
  if (seedPassword.length < 12) {
    throw new Error('SEED_PASSWORD must be at least 12 characters long.');
  }
  if (Buffer.byteLength(seedPassword, 'utf8') > 72) {
    throw new Error('SEED_PASSWORD must not exceed 72 UTF-8 bytes.');
  }
  const commonPassword = await bcrypt.hash(seedPassword, 12);

  await prisma.$transaction(async (tx) => {
    // ---------------------------------------------------------------------------
    // 2. COURSES CATALOG
    // ---------------------------------------------------------------------------
    const courseMern = await tx.course.upsert({
      where: { courseCode: 'FSW-2026' },
      create: {
        courseCode: 'FSW-2026',
        title: 'Full-Stack Web Development (MERN & Next.js)',
        description: 'Comprehensive industry training in React, Next.js, Node.js, Express, PostgreSQL, and Prisma ORM.',
        duration: '6 Months',
        totalFee: 45000,
        level: 'ADVANCED',
      },
      update: {},
    });

    await tx.course.upsert({
      where: { courseCode: 'CYB-101' },
      create: {
        courseCode: 'CYB-101',
        title: 'Cybersecurity & Ethical Defense Fundamentals',
        description: 'Hands-on network penetration testing, Linux administration, and enterprise zero-trust architectures.',
        duration: '4 Months',
        totalFee: 38000,
        level: 'INTERMEDIATE',
      },
      update: {},
    });

    console.log('✅ Courses catalog provisioned.');

    // ---------------------------------------------------------------------------
    // 3. ROLE: SUPER ADMIN (HQ Operations)
    // ---------------------------------------------------------------------------
    const superAdminUser = await tx.user.upsert({
      where: { email: 'admin@viqtech.in' },
      create: {
        email: 'admin@viqtech.in',
        password: commonPassword,
        role: Role.SUPER_ADMIN,
      },
      update: {
        role: Role.SUPER_ADMIN,
        ...(resetExistingPasswords ? { password: commonPassword } : {}),
      },
    });

    console.log('✅ Super Admin created: admin@viqtech.in');

    // ---------------------------------------------------------------------------
    // 4. ROLE: CENTER ADMIN (Branch Directorate)
    // ---------------------------------------------------------------------------
    const centerAdminUser = await tx.user.upsert({
      where: { email: 'center.ludhiana@viqtech.in' },
      create: {
        email: 'center.ludhiana@viqtech.in',
        password: commonPassword,
        role: Role.CENTER_ADMIN,
      },
      update: {
        role: Role.CENTER_ADMIN,
        ...(resetExistingPasswords ? { password: commonPassword } : {}),
      },
    });

    const centerLudhiana = await tx.center.upsert({
      where: { centerCode: 'CTR-LDH-01' },
      create: {
        centerCode: 'CTR-LDH-01',
        name: 'VIQ Institute of Technology (Ludhiana Campus)',
        authorizedPerson: 'Rajesh Sharma',
        phone: '+91 98765 11223',
        address: 'Plot 42, Focal Point Commercial Hub, Ludhiana, Punjab - 141010',
        isActive: true,
        userId: centerAdminUser.id,
      },
      update: {},
    });

    console.log('✅ Center Admin created: center.ludhiana@viqtech.in');

    // ---------------------------------------------------------------------------
    // 5. ROLE: TEACHER (Assigned Faculty Mentor)
    // ---------------------------------------------------------------------------
    const teacherUser = await tx.user.upsert({
      where: { email: 'mentor.kapoor@viqtech.in' },
      create: {
        email: 'mentor.kapoor@viqtech.in',
        password: commonPassword,
        role: Role.TEACHER,
      },
      update: {
        role: Role.TEACHER,
        ...(resetExistingPasswords ? { password: commonPassword } : {}),
      },
    });

    const teacherVikram = await tx.teacher.upsert({
      where: { teacherCode: 'TCH-101' },
      create: {
        teacherCode: 'TCH-101',
        fullName: 'Vikram Kapoor',
        phone: '+91 98112 33445',
        specialization: 'Full-Stack Architecture & Cloud APIs',
        isActive: true,
        userId: teacherUser.id,
        centerId: centerLudhiana.id,
      },
      update: {},
    });

    console.log('✅ Teacher created: mentor.kapoor@viqtech.in');

    // ---------------------------------------------------------------------------
    // 6. ROLE: STUDENT 1 (Active Candidate with Partial EMI Fee Plan)
    // ---------------------------------------------------------------------------
    const studentUser1 = await tx.user.upsert({
      where: { email: 'sahil.student@viqtech.in' },
      create: {
        email: 'sahil.student@viqtech.in',
        password: commonPassword,
        role: Role.STUDENT,
      },
      update: {
        role: Role.STUDENT,
        ...(resetExistingPasswords ? { password: commonPassword } : {}),
      },
    });

    const studentSahil = await tx.student.upsert({
      where: { studentCode: 'STU-2026-001' },
      create: {
        studentCode: 'STU-2026-001',
        fullName: 'Sahil Verma',
        phone: '+91 98721 99887',
        dob: new Date('2004-06-15T00:00:00.000Z'),
        gender: 'Male',
        address: 'Hostel Block B, Room 204, Khanna, Punjab',
        govIdNumber: 'XXXX-XXXX-4521',
        userId: studentUser1.id,
        centerId: centerLudhiana.id,
        teacherId: teacherVikram.id,
        courseId: courseMern.id,
      },
      update: {},
    });

    // Billing Plan for Student 1: 3-Stage EMI (Total: 45,000, Paid: 15,000, Balance: 30,000)
    const feePlanSahil = await tx.feePlan.upsert({
      where: { studentId: studentSahil.id },
      create: {
        studentId: studentSahil.id,
        type: FeeType.EMI,
        totalAmount: 45000,
        paidAmount: 15000,
        balance: 30000,
        status: PaymentStatus.PARTIAL,
      },
      update: {},
    });

    // Initial Advance Payment Receipt
    await tx.payment.upsert({
      where: { receiptNo: 'RCP-2026-0081' },
      create: {
        receiptNo: 'RCP-2026-0081',
        feePlanId: feePlanSahil.id,
        amount: 15000,
        mode: 'UPI',
        paymentDate: new Date('2026-09-01T10:00:00.000Z'),
      },
      update: {},
    });

    // EMI Installment Milestones
    const firstInstallment = await tx.installment.findFirst({
      where: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-09-01T00:00:00.000Z'),
      },
    });
    if (!firstInstallment) {
      await tx.installment.create({
        data: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-09-01T00:00:00.000Z'),
        amount: 15000,
        status: PaymentStatus.PAID,
        paidAt: new Date('2026-09-01T10:00:00.000Z'),
        },
      });
    }

    const secondInstallment = await tx.installment.findFirst({
      where: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-11-01T00:00:00.000Z'),
      },
    });
    if (!secondInstallment) {
      await tx.installment.create({
        data: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-11-01T00:00:00.000Z'),
        amount: 15000,
        status: PaymentStatus.PENDING,
        alert7dSent: false,
        },
      });
    }

    const thirdInstallment = await tx.installment.findFirst({
      where: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-12-01T00:00:00.000Z'),
      },
    });
    if (!thirdInstallment) {
      await tx.installment.create({
        data: {
        feePlanId: feePlanSahil.id,
        dueDate: new Date('2026-12-01T00:00:00.000Z'),
        amount: 15000,
        status: PaymentStatus.PENDING,
        alert7dSent: false,
        },
      });
    }

    // Strict Calendar Date Normalization for @db.Date field
    const attendanceDays = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];
    for (const day of attendanceDays) {
      await tx.attendance.upsert({
        where: {
          studentId_date: {
            studentId: studentSahil.id,
            date: new Date(`${day}T00:00:00.000Z`),
          },
        },
        create: {
          studentId: studentSahil.id,
          teacherId: teacherVikram.id,
          date: new Date(`${day}T00:00:00.000Z`),
          status: day === '2026-10-20' ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        },
        update: {},
      });
    }

    console.log('✅ Student 1 created: sahil.student@viqtech.in (EMI Plan Active)');

    // ---------------------------------------------------------------------------
    // 7. ROLE: STUDENT 2 (Fully Cleared Lump-sum Candidate)
    // ---------------------------------------------------------------------------
    const studentUser2 = await tx.user.upsert({
      where: { email: 'ananya.student@viqtech.in' },
      create: {
        email: 'ananya.student@viqtech.in',
        password: commonPassword,
        role: Role.STUDENT,
      },
      update: {
        role: Role.STUDENT,
        ...(resetExistingPasswords ? { password: commonPassword } : {}),
      },
    });

    const studentAnanya = await tx.student.upsert({
      where: { studentCode: 'STU-2026-002' },
      create: {
        studentCode: 'STU-2026-002',
        fullName: 'Ananya Roy',
        phone: '+91 97800 12345',
        dob: new Date('2003-11-20T00:00:00.000Z'),
        gender: 'Female',
        address: 'Civil Lines, Ludhiana, Punjab',
        govIdNumber: 'XXXX-XXXX-9912',
        userId: studentUser2.id,
        centerId: centerLudhiana.id,
        teacherId: teacherVikram.id,
        courseId: courseMern.id,
      },
      update: {},
    });

    const feePlanAnanya = await tx.feePlan.upsert({
      where: { studentId: studentAnanya.id },
      create: {
        studentId: studentAnanya.id,
        type: FeeType.ONE_TIME,
        totalAmount: 45000,
        paidAmount: 45000,
        balance: 0,
        status: PaymentStatus.PAID,
      },
      update: {},
    });

    await tx.payment.upsert({
      where: { receiptNo: 'RCP-2026-0082' },
      create: {
        receiptNo: 'RCP-2026-0082',
        feePlanId: feePlanAnanya.id,
        amount: 45000,
        mode: 'NET_BANKING',
        paymentDate: new Date('2026-09-05T11:30:00.000Z'),
      },
      update: {},
    });

    // Certificate provisioned with ISSUED status for cleared student
    await tx.certificate.upsert({
      where: { certNumber: 'CERT-2026-STU-2026-002' },
      create: {
        certNumber: 'CERT-2026-STU-2026-002',
        studentId: studentAnanya.id,
        certType: 'Professional Full-Stack Accreditation',
        status: CertificateStatus.ISSUED,
        issueDate: new Date('2026-10-15T00:00:00.000Z'),
        verificationUrl: '/certificate/STU-2026-002',
      },
      update: {},
    });

    console.log('✅ Student 2 created: ananya.student@viqtech.in (Fee Fully Cleared)');

    // ---------------------------------------------------------------------------
    // 8. COURSEWORK LAB TASKS & SUBMISSIONS
    // ---------------------------------------------------------------------------
    const taskData = {
      title: 'Lab 04: Implement JWT Middleware & RBAC in Next.js',
      description: 'Create route-level authorization guards preventing non-teacher accounts from accessing faculty endpoints. Submit your GitHub repository URL.',
      dueDate: new Date('2026-10-30T18:00:00.000Z'),
      courseId: courseMern.id,
      teacherId: teacherVikram.id,
    };
    const existingTask = await tx.task.findFirst({
      where: {
        title: taskData.title,
        courseId: courseMern.id,
        teacherId: teacherVikram.id,
      },
    });
    const task1 = existingTask
      ? await tx.task.update({ where: { id: existingTask.id }, data: taskData })
      : await tx.task.create({ data: taskData });

    // Student 1 submits repository
    await tx.taskSubmission.upsert({
      where: {
        taskId_studentId: {
          taskId: task1.id,
          studentId: studentSahil.id,
        },
      },
      create: {
        taskId: task1.id,
        studentId: studentSahil.id,
        submissionUrl: 'https://github.com/sahilraza12/lms-rbac-middleware',
        fileUrls: ['https://storage.googleapis.com/viq-cdn/submissions/lab04-proof.pdf'],
        remarks: 'Configured role checks using jose library and Next.js Edge Middleware.',
        status: TaskSubmissionStatus.REVIEWED,
        feedback: 'Clean separation of concerns. Token validation logic is robust. 9.5/10',
        reviewedAt: new Date('2026-10-21T14:30:00.000Z'),
      },
      update: {},
    });

    console.log('✅ Coursework tasks and submissions seeded.');

    // ---------------------------------------------------------------------------
    // 9. MULTI-TIER OFFICIAL ANNOUNCEMENTS & RECIPIENTS
    // ---------------------------------------------------------------------------
    const announcementData = {
        title: 'Academic Notice: Fall 2026 Practical Examination Timetable',
        content: 'All regional training centers are hereby notified that the final technical evaluations will commence on November 10, 2026. Hall tickets will be downloadable via the student portal.',
        priority: NoticePriority.IMPORTANT,
        senderId: superAdminUser.id,
        senderRole: Role.SUPER_ADMIN,
        senderName: 'Central Examination Directorate',
        targetRole: null, // Null = Global Broadcast to all roles
        emailSent: false,
        sentCount: 0,
    };
    const existingAnnouncement = await tx.announcement.findFirst({
      where: {
        senderId: superAdminUser.id,
        title: announcementData.title,
        centerId: null,
        teacherId: null,
      },
    });
    const announcementGlobal = existingAnnouncement
      ? await tx.announcement.update({
          where: { id: existingAnnouncement.id },
          data: announcementData,
        })
      : await tx.announcement.create({ data: announcementData });

    // Track read status for enrolled students
    await tx.announcementRecipient.upsert({
      where: {
        announcementId_userId: {
          announcementId: announcementGlobal.id,
          userId: studentUser1.id,
        },
      },
      create: {
        announcementId: announcementGlobal.id,
        userId: studentUser1.id,
        isRead: true,
        readAt: new Date('2026-10-21T10:00:00.000Z'),
      },
      update: {},
    });

    await tx.announcementRecipient.upsert({
      where: {
        announcementId_userId: {
          announcementId: announcementGlobal.id,
          userId: studentUser2.id,
        },
      },
      create: {
        announcementId: announcementGlobal.id,
        userId: studentUser2.id,
        isRead: false,
      },
      update: {},
    });

    console.log('✅ Announcements and broadcast recipients populated.');
  },
   { maxWait: 20000, timeout: 60000 });

  console.log('🏁 Database seeding finished successfully.');
  console.log(
    resetExistingPasswords
      ? 'All demo account passwords were reset from SEED_PASSWORD.'
      : 'New demo account passwords were set from SEED_PASSWORD.',
  );
}

main()
  .catch((error: unknown) => {
    console.error('❌ Error during seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (error: unknown) {
      console.error('❌ Error disconnecting from the database:', error);
      process.exitCode = 1;
    }
  });
