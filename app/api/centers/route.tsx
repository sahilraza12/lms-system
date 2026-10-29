'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Users, 
  UserCheck, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  CreditCard,
  GraduationCap,
  Menu,
  Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function CenterDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'revenue' | 'admissions' | 'faculty'>('revenue');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Revenue Calculator
  const [studentsCount, setStudentsCount] = useState<number>(75);
  const [avgFee, setAvgFee] = useState<number>(22000);

  // Faculty State
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [submittingTeacher, setSubmittingTeacher] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState({ type: '', text: '' });

  const totalGross = studentsCount * avgFee;
  const hqRoyalty = Math.round(totalGross * 0.25);
  const centerNetProfit = totalGross - hqRoyalty;

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const res = await fetch('/api/center/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'faculty') {
      void fetchTeachers();
    }
  }, [activeTab]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTeacher(true);
    setTeacherMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/center/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherName,
          email: teacherEmail,
          password: teacherPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate teacher credentials.');

      setTeacherMsg({ type: 'success', text: 'Teacher credential generated successfully!' });
      setTeacherName('');
      setTeacherEmail('');
      setTeacherPassword('');
      await fetchTeachers();
      setTimeout(() => {
        setShowTeacherModal(false);
        setTeacherMsg({ type: '', text: '' });
      }, 1200);
    } catch (err: any) {
      setTeacherMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingTeacher(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#07090E] text-slate-100 font-sans">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B0F17] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo size={44} />
              <div>
                <h2 className="text-xs font-black tracking-tight text-white leading-none">Khanna Branch</h2>
                <span className="text-[9px] font-mono text-orange-400 font-bold tracking-wider">VIQ-KHN-01 NODE</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => { setActiveTab('revenue'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'revenue' 
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Branch Revenue</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admissions'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'admissions' 
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Local Admissions & EMIs</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('faculty'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'faculty' 
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Faculty & Teachers</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-[10px] font-mono text-slate-500 uppercase">Branch Security</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Isolated Local Node
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 min-w-0">
        
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl border border-white/10 bg-[#0E131F] md:hidden text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {activeTab === 'revenue' && 'Branch Revenue & Ledger'}
                {activeTab === 'admissions' && 'Local Candidate Admissions & EMIs'}
                {activeTab === 'faculty' && 'Branch Faculty Management'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                VIQ Technologies — Khanna HQ Node (Single-Branch Scope)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'faculty' && (
              <button
                type="button"
                onClick={() => setShowTeacherModal(true)}
                className="viq-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Teacher ID</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#0E131F] text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* TAB 1: REVENUE OVERVIEW */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Branch Gross Fee</span>
                  <Wallet className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-2xl font-black text-white">₹37,000</h3>
                <p className="text-[10px] font-mono text-slate-500">Collected at VIQ-KHN-01</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Net Retained Share (75%)</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-emerald-400">₹27,750</h3>
                <p className="text-[10px] font-mono text-slate-500">After 25% HQ Royalty</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Pending Branch EMIs</span>
                  <Wallet className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-amber-400">₹8,000</h3>
                <p className="text-[10px] font-mono text-slate-500">Upcoming Student Dues</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Active Branch Students</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-white">2</h3>
                <p className="text-[10px] font-mono text-slate-500">Enrolled Candidates</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#0D111A] border border-white/10 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                    [ MY BRANCH REVENUE & PAYOUT CALCULATOR ]
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">Estimate Your Center&apos;s Monthly Earnings</h2>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  SINGLE-BRANCH SCOPE (VIQ-KHN-01)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-300">Target Student Admissions</span>
                      <span className="text-orange-400 font-mono">{studentsCount} Students</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="300" 
                      value={studentsCount} 
                      onChange={(e) => setStudentsCount(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-300">Average Course Fee</span>
                      <span className="text-orange-400 font-mono">₹{avgFee.toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="60000" 
                      step="1000"
                      value={avgFee} 
                      onChange={(e) => setAvgFee(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 rounded-2xl bg-[#07090E] border border-white/10 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      My Center Net Profit (75% Share)
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1 font-mono">
                      ₹{centerNetProfit.toLocaleString('en-IN')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Gross</span>
                      <span className="font-bold text-white font-mono">₹{totalGross.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">HQ Royalty (25%)</span>
                      <span className="font-bold text-orange-400 font-mono">₹{hqRoyalty.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL ADMISSIONS */}
        {activeTab === 'admissions' && (
          <div className="p-8 rounded-2xl bg-[#0D111A] border border-white/10 space-y-4 text-center">
            <GraduationCap className="w-12 h-12 text-orange-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Branch Student Admissions & Roster</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Students enrolled at the Khanna branch appear here along with installment payment schedules and verification hashes.
            </p>
          </div>
        )}

        {/* TAB 3: FACULTY & TEACHERS */}
        {activeTab === 'faculty' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Branch Teaching Faculty</h3>
                <p className="text-xs text-slate-400">Manage instructors assigned to this branch location.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(true)}
                className="viq-btn-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Teacher</span>
              </button>
            </div>

            {loadingTeachers ? (
              <div className="py-20 text-center rounded-2xl bg-[#0D111A] border border-white/10">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-mono">Loading branch instructors...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#0D111A] border border-dashed border-white/10 space-y-3">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Teachers Created Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Create Teacher ID&quot; to assign faculty members to this branch so they can sign in to the Teacher Workspace.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0D111A] border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-6">Faculty Name</th>
                      <th className="py-3 px-6">Login Email / Identifier</th>
                      <th className="py-3 px-6">Assigned Role</th>
                      <th className="py-3 px-6">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                            {t.name[0]}
                          </div>
                          <span>{t.name}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">{t.email}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {t.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE TEACHER MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0B0F17] border border-white/10 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  <span>Create Faculty / Teacher ID</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Credentials for instructors to log into the Teacher Workspace.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTeacherModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherMsg.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                teacherMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {teacherMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{teacherMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Instructor Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Er. Hardeep Singh"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121620] border border-white/10 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Login Email / Workspace Identifier *
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="faculty.khanna@viqtech.in"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121620] border border-white/10 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Initial Login Password *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Create temporary password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121620] border border-white/10 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeacher}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingTeacher ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Generate ID</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}