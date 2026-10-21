'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Users, GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RolePortals() {
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'CENTER' | 'STUDENT'>('CENTER');

  return (
    <section id="portals" className="py-20 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Purpose-Built Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            One Ecosystem. Three Dedicated Workspaces.
          </h2>
          <p className="text-sm text-slate-600 mt-3">
            Har stakeholder ke liye dedicated access, role-based controls, aur real-time telemetry analytics.
          </p>

          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mt-6">
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ADMIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Headquarters Admin
            </button>
            <button
              onClick={() => setActiveTab('CENTER')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'CENTER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Training Center Portal
            </button>
            <button
              onClick={() => setActiveTab('STUDENT')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'STUDENT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Student Learning Desk
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
          {activeTab === 'ADMIN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  <Building2 className="w-4 h-4" /> Super Admin & HQ Command Center
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Complete Governance Over All Partner Centers & Revenue
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Onboard new training franchises, define master curriculum pricing, monitor overdue EMI defaulters across branches, and issue tamper-proof certificates.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Multi-center onboarding, activation, and instant suspension controls
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Branch-wise financial audit reports & overdue installment alerts
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    One-click approval for Company, Skill India (NSQF), and International credentials
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Access Admin HQ <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800">HQ Governance Snapshot</span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold">Live Audit</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">Center Network</p>
                    <p className="text-xl font-black text-slate-900 mt-1">Multi-Branch</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">Certificate Control</p>
                    <p className="text-xl font-black text-indigo-600 mt-1">Zero-Balance Lock</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Demo Login: <span className="font-mono text-slate-800">admin@lms.com</span> / <span className="font-mono text-slate-800">password123</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CENTER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  <Users className="w-4 h-4" /> Franchise & Center Operations Desk
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Effortless Student Admissions, EMI Schedules & Instant Receipts
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Admit students in seconds, configure down-payments with auto-calculated monthly installments, record fee collections, and print A4 vouchers immediately.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Automated EMI splitting based on down-payment and installment count
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Instant A4 printable payment receipts with ledger summary
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Upload course PDFs, study notes, and practical assignments for batches
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Login to Center Portal <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800">Automated EMI Engine</span>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">Instant Voucher</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Total Course Fee</span>
                    <span className="font-mono font-bold">₹25,000</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-emerald-50 text-emerald-900">
                    <span>Down Payment Collected</span>
                    <span className="font-mono font-bold">₹10,000 (Paid)</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-amber-50 text-amber-900">
                    <span>Auto-Scheduled EMIs (2x)</span>
                    <span className="font-mono font-bold">₹7,500 / month</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Demo Login: <span className="font-mono text-slate-800">center@apexskills.com</span> / <span className="font-mono text-slate-800">password123</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'STUDENT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  <GraduationCap className="w-4 h-4" /> Candidate Learning & Credential Portal
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  24/7 Access to Study Notes, Project Submissions & Digital Certificates
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Students track their enrolled program, download module PDFs, submit assignment URLs before deadlines, monitor upcoming EMI dates, and download verifiable certificates.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Interactive Assignment Submission Desk with GitHub/Drive link support
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Transparent fee passbook with installment status tracking
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    One-click printable A4 Certificate once dues are cleared
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Open Student Portal <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-800">Student Progress Card</span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold">STU-1001</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-900">Full Stack Web Development (MERN)</p>
                  <p className="text-slate-500">2 Study Modules • 1 Capstone Project Assigned</p>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Demo Login: <span className="font-mono text-slate-800">student@example.com</span> / <span className="font-mono text-slate-800">password123</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}