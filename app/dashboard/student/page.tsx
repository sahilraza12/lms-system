'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  CreditCard, 
  FileText, 
  User, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface StudentProfile {
  name: string;
  enrollmentNo: string;
  course: string;
  batch: string;
  attendancePercent: number;
  totalModules: number;
  completedModules: number;
  feesStatus: 'PAID' | 'DUE' | 'PARTIAL';
  pendingFeeAmount: number;
}

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile>({
    name: 'Student Candidate',
    enrollmentNo: 'LMS-2026-STU-01',
    course: 'Full-Stack Web Development',
    batch: 'Batch 2026',
    attendancePercent: 88,
    totalModules: 12,
    completedModules: 8,
    feesStatus: 'PARTIAL',
    pendingFeeAmount: 5000,
  });

  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0 font-sans p-4 sm:p-6">
      
      {/* 1. Header Banner */}
      <div className="viq-card p-6 sm:p-8 rounded-2xl border border-[var(--border-color)] bg-gradient-to-r from-orange-500/10 via-transparent to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Student Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Roll No: {profile.enrollmentNo}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track your ongoing coursework, fees ledger, certifications, and academic progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/verify-certificate"
            className="viq-pill px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border border-slate-700 hover:text-white transition"
          >
            <Award className="w-4 h-4 text-orange-500" />
            <span>Verify Certificates</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="viq-card p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Enrolled Course</span>
            <BookOpen className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-base font-bold text-white truncate">{profile.course}</p>
          <span className="text-[11px] text-slate-400 block">{profile.batch}</span>
        </div>

        {/* Metric 2 */}
        <div className="viq-card p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Course Progress</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold font-mono text-white">
              {Math.round((profile.completedModules / profile.totalModules) * 100)}%
            </p>
            <span className="text-xs font-mono text-slate-400">
              {profile.completedModules}/{profile.totalModules} Units
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full" 
              style={{ width: `${(profile.completedModules / profile.totalModules) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="viq-card p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Attendance</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{profile.attendancePercent}%</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Eligible for examination
          </span>
        </div>

        {/* Metric 4 */}
        <div className="viq-card p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase">Tuition Ledger</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-bold font-mono text-amber-500">
              {profile.pendingFeeAmount > 0 ? `₹${profile.pendingFeeAmount.toLocaleString('en-IN')}` : 'Cleared'}
            </p>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {profile.feesStatus}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            {profile.pendingFeeAmount > 0 ? 'Pending installment' : 'No overdue dues'}
          </span>
        </div>

      </div>

      {/* 3. Main Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Syllabus & Progress */}
        <div className="lg:col-span-2 viq-card p-6 rounded-2xl border border-[var(--border-color)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <span>Modules & Curriculum Roadmap</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Track completed chapters and upcoming assessments.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 1, title: 'Foundations & Architecture', status: 'COMPLETED', date: 'Oct 2026' },
              { id: 2, title: 'Database Relational Modelling & ORM', status: 'COMPLETED', date: 'Oct 2026' },
              { id: 3, title: 'Stateful Communication & Authentication', status: 'IN_PROGRESS', date: 'Current Week' },
              { id: 4, title: 'Full Stack Capstone Deployment', status: 'UPCOMING', date: 'Upcoming' },
            ].map((module) => (
              <div 
                key={module.id} 
                className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    module.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    module.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {module.id}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-200">{module.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{module.date}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                  module.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                  module.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {module.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Actions & Credentials */}
        <div className="space-y-6">
          
          {/* Quick Access Card */}
          <div className="viq-card p-6 rounded-2xl border border-[var(--border-color)] space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Student Quick Links</span>
            </h2>

            <div className="space-y-2">
              <Link 
                href="/receipt"
                className="w-full p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition flex items-center justify-between text-xs text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Fee Receipts & Invoices</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link 
                href="/certificate"
                className="w-full p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition flex items-center justify-between text-xs text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>My Certificates</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Academic Notice Banner */}
          <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Semester Examination Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ensure all installment dues are cleared and enrollment codes verified to obtain your examination admit slips.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}