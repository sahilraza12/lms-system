'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Award, 
  Receipt, 
  Megaphone, 
  Sparkles 
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function StudentPortalPage() {
  const [student] = useState({
    name: 'Sahil Raza',
    enrollmentNo: 'VIQ-2026-101',
    courseName: 'Full-Stack Web Development (MERN)',
    batch: '2026 Morning Cohort',
    progress: 85,
    certificateId: 'VIQ-2026-101',
    receiptId: 'RCP-2026-101',
  });

  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Build Role-Isolated JWT Authentication Middleware', status: 'COMPLETED' },
    { id: 't2', title: 'Deploy Full-Stack MERN Microservice with PostgreSQL', status: 'PENDING' },
  ]);

  const handleCompleteTask = (taskId: string) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
    );
  };

  return (
    <div className="viq-page min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Student Navbar */}
      <header className="sticky top-0 z-30 h-16 viq-nav px-6 sm:px-12 flex items-center justify-between border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <div className="viq-btn-primary w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs">
            VIQ
          </div>
          <div>
            <span className="text-sm font-bold block">VIQ Learning Cloud</span>
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest block">
              CANDIDATE ID: {student.enrollmentNo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/receipt/${student.receiptId}`}
            className="hidden sm:inline-flex items-center gap-1.5 viq-pill px-3.5 py-2 text-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-500" />
            <span>My Fee Receipt</span>
          </Link>
          <ThemeToggle />
          <LogoutButton
            className="viq-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs hover:border-red-500/50 hover:text-red-500 transition disabled:opacity-60"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Welcome Banner */}
        <div className="viq-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--bg-glass-subtle)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 viq-pill px-3 py-1 text-cyan-600 dark:text-cyan-400 text-[11px] font-mono uppercase">
              <Sparkles className="w-3 h-3" />
              Active Candidate Workspace
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome back, {student.name}
            </h1>
            <p className="text-xs sm:text-sm viq-text-secondary">
              Enrolled Program: <span className="font-semibold text-[var(--text-primary)]">{student.courseName}</span> ({student.batch})
            </p>
          </div>

          <Link
            href={`/certificate/${student.certificateId}`}
            className="viq-btn-primary px-6 py-3.5 text-xs flex items-center gap-2 shrink-0"
          >
            <Award className="w-4 h-4" />
            <span>View Digital Certificate</span>
          </Link>
        </div>

        {/* Notice Board */}
        <div className="viq-card p-6 space-y-3 bg-amber-500/[0.04] border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono uppercase font-bold">
            <Megaphone className="w-4 h-4" />
            <span>Live Academic Notice Board</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs flex justify-between">
            <span>Mid-Term Practical Cloud & VAPT Lab Assessment on Monday 10:00 AM</span>
            <span className="font-mono text-amber-500">NEW</span>
          </div>
        </div>

        {/* Course Progress */}
        <div className="viq-card p-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              Curriculum Completion Telemetry
            </span>
            <span className="font-mono font-bold text-cyan-500">{student.progress}% COMPLETED</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-glass-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 transition-all duration-700"
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>

        {/* Notes & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="viq-card p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black">Curated Study Notes</h2>
              </div>
              <span className="text-[11px] font-mono viq-text-muted">3 MODULES</span>
            </div>
            <div className="space-y-3">
              {[
                'Module 01: MERN Stack & Next.js Architecture',
                'Module 02: PostgreSQL & Prisma ORM Schema Design',
                'Module 03: VAPT & Cybersecurity Defense',
              ].map((note, idx) => (
                <div key={idx} className="viq-pill p-4 flex items-center justify-between gap-4 text-xs">
                  <span className="font-bold">{note}</span>
                  <button onClick={() => alert(`Opening: ${note}`)} className="viq-btn-primary px-3 py-1.5 text-[11px]">
                    Read PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="viq-card p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-black">Lab Assignments & Tasks</h2>
              </div>
              <span className="text-[11px] font-mono viq-text-muted">LIVE LABS</span>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="viq-pill p-4 flex items-center justify-between gap-4 text-xs">
                  <span className="font-bold">{task.title}</span>
                  {task.status === 'COMPLETED' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold text-[10px]">
                      COMPLETED
                    </span>
                  ) : (
                    <button onClick={() => handleCompleteTask(task.id)} className="viq-btn-primary px-3 py-1.5 text-[11px]">
                      Submit Lab
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}