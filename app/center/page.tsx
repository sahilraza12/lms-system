'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Wallet, 
  UserPlus, 
  Receipt, 
  Clock, 
  FileText, 
  CheckSquare, 
  Megaphone,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface BranchStudent {
  id: string;
  name: string;
  enrollmentNo: string;
  courseName: string;
  totalFee: number;
  paidFee: number;
}

const centerTabs = [
  { id: 'overview', label: 'Branch Revenue' },
  { id: 'students', label: 'Local Admissions & EMIs' },
  { id: 'academic', label: 'Notes & Tasks' },
] as const;

export default function CenterPortalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'academic' | 'announcements'>('overview');
  const [branchName, setBranchName] = useState('VIQ Technologies - Khanna HQ');
  const [branchCode, setBranchCode] = useState('VIQ-KHN-01');

  const [students, setStudents] = useState<BranchStudent[]>([
    { id: 'st-101', name: 'Aarav Verma', enrollmentNo: 'VIQ-2026-101', courseName: 'Full-Stack Web Development', totalFee: 25000, paidFee: 25000 },
    { id: 'st-102', name: 'Priya Sharma', enrollmentNo: 'VIQ-2026-102', courseName: 'Cybersecurity & VAPT', totalFee: 20000, paidFee: 12000 },
  ]);

  const [newStName, setNewStName] = useState('');
  const [newStCourse, setNewStCourse] = useState('Full-Stack Web Development');
  const [newStTotalFee, setNewStTotalFee] = useState('25000');
  const [newStPaidFee, setNewStPaidFee] = useState('12500');

  // Simulator States
  const [myStudents, setMyStudents] = useState<number>(75);
  const [myAvgTuition, setMyAvgTuition] = useState<number>(22000);
  const hqRoyaltyFixed = 25;

  const branchCollected = students.reduce((sum, s) => sum + Number(s.paidFee || 0), 0);
  const branchPending = students.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalFee || 0) - Number(s.paidFee || 0)),
    0
  );
  const branchNetEarnings = Math.round(branchCollected * ((100 - hqRoyaltyFixed) / 100));

  const projectedBranchGross = myStudents * myAvgTuition;
  const projectedHqCut = Math.round((projectedBranchGross * hqRoyaltyFixed) / 100);
  const projectedCenterNetProfit = projectedBranchGross - projectedHqCut;

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStName) return;
    const entry: BranchStudent = {
      id: `st-${Date.now()}`,
      name: newStName,
      enrollmentNo: `VIQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      courseName: newStCourse,
      totalFee: Number(newStTotalFee) || 25000,
      paidFee: Number(newStPaidFee) || 0,
    };
    setStudents([entry, ...students]);
    setNewStName('');
  };

  const handleCollectInstallment = (studentId: string) => {
    const amountStr = prompt('Enter EMI Installment Amount collected (₹):', '5000');
    const amount = Number(amountStr);
    if (!amount || amount <= 0) return;

    setStudents(
      students.map((s) =>
        s.id === studentId ? { ...s, paidFee: Math.min(s.totalFee, s.paidFee + amount) } : s
      )
    );
  };

  return (
    <div className="viq-page min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-16 viq-nav px-6 sm:px-12 flex items-center justify-between border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <div className="viq-btn-primary w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs">
            VIQ
          </div>
          <div>
            <span className="text-sm font-bold block">{branchName}</span>
            <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest block">
              {branchCode} {'//'} ISOLATED BRANCH WORKSPACE
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-2 p-1 rounded-2xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)]">
          {centerTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === t.id ? 'viq-btn-primary shadow-sm' : 'viq-text-secondary hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton
            className="viq-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs hover:border-red-500/50 hover:text-red-500 transition disabled:opacity-60"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-12 space-y-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="viq-card p-6 space-y-2">
            <div className="flex items-center justify-between text-xs viq-text-secondary font-bold">
              <span>Branch Gross Fee</span>
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black font-mono">₹{branchCollected.toLocaleString('en-IN')}</p>
            <span className="text-[10px] font-mono viq-text-muted block font-bold">Collected at {branchCode}</span>
          </div>

          <div className="viq-card p-6 space-y-2">
            <div className="flex items-center justify-between text-xs viq-text-secondary font-bold">
              <span>Net Retained Share (75%)</span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-500 font-mono">₹{branchNetEarnings.toLocaleString('en-IN')}</p>
            <span className="text-[10px] font-mono viq-text-muted block font-bold">After {hqRoyaltyFixed}% HQ Royalty</span>
          </div>

          <div className="viq-card p-6 space-y-2">
            <div className="flex items-center justify-between text-xs viq-text-secondary font-bold">
              <span>Pending Branch EMIs</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-500 font-mono">₹{branchPending.toLocaleString('en-IN')}</p>
            <span className="text-[10px] font-mono viq-text-muted block font-bold">Upcoming Student Dues</span>
          </div>

          <div className="viq-card p-6 space-y-2">
            <div className="flex items-center justify-between text-xs viq-text-secondary font-bold">
              <span>Active Branch Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black font-mono">{students.length}</p>
            <span className="text-[10px] font-mono viq-text-muted block font-bold">Enrolled Candidates</span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & REVENUE CALCULATOR */}
        {activeTab === 'overview' && (
          <div className="viq-card p-8 space-y-7 bg-[var(--bg-glass-subtle)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
              <div>
                <div className="inline-flex items-center gap-2 text-orange-500 text-xs font-mono uppercase font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>[ MY BRANCH REVENUE & PAYOUT CALCULATOR ]</span>
                </div>
                <h2 className="text-xl font-black mt-1">Estimate Your Center’s Monthly Earnings</h2>
              </div>
              <span className="viq-pill px-3 py-1 text-[11px] font-mono">
                SINGLE-BRANCH SCOPE ({branchCode})
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="viq-text-secondary">Target Student Admissions</span>
                    <span className="font-mono text-orange-500">{myStudents} Students</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={5}
                    value={myStudents}
                    onChange={(e) => setMyStudents(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="viq-text-secondary">Average Course Fee</span>
                    <span className="font-mono text-orange-500">₹{myAvgTuition.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={50000}
                    step={1000}
                    value={myAvgTuition}
                    onChange={(e) => setMyAvgTuition(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                    My Center Net Profit (75% Share)
                  </span>
                  <p className="text-3xl font-black text-emerald-500 font-mono mt-0.5">
                    ₹{projectedCenterNetProfit.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)] text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Total Gross</span>
                    <p className="font-bold font-mono">₹{projectedBranchGross.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">HQ Royalty</span>
                    <p className="font-bold text-orange-500 font-mono">₹{projectedHqCut.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS & EMIS */}
        {(activeTab === 'overview' || activeTab === 'students') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleAddStudent} className="lg:col-span-4 viq-card p-7 space-y-4 h-fit">
              <div className="flex items-center gap-2 text-orange-500 text-xs font-mono uppercase font-bold">
                <UserPlus className="w-4 h-4" />
                <span>New Branch Admission</span>
              </div>
              <input
                type="text"
                required
                value={newStName}
                onChange={(e) => setNewStName(e.target.value)}
                placeholder="Candidate Full Name"
                className="viq-input w-full px-4 py-3 text-xs"
              />
              <input
                type="text"
                required
                value={newStCourse}
                onChange={(e) => setNewStCourse(e.target.value)}
                placeholder="Program Name"
                className="viq-input w-full px-4 py-3 text-xs"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  value={newStTotalFee}
                  onChange={(e) => setNewStTotalFee(e.target.value)}
                  placeholder="Total Fee (₹)"
                  className="viq-input w-full px-4 py-3 text-xs font-mono"
                />
                <input
                  type="number"
                  required
                  value={newStPaidFee}
                  onChange={(e) => setNewStPaidFee(e.target.value)}
                  placeholder="Initial Paid (₹)"
                  className="viq-input w-full px-4 py-3 text-xs font-mono"
                />
              </div>
              <button type="submit" className="viq-btn-primary w-full py-3 text-xs">
                Register Candidate
              </button>
            </form>

            <div className="lg:col-span-8 viq-card overflow-hidden">
              <div className="p-6 border-b border-[var(--border-color)]">
                <h3 className="text-base font-black">Branch Roster & Installments</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                      <th className="py-3.5 px-6 font-bold">Candidate & ID</th>
                      <th className="py-3.5 px-6 font-bold">Paid</th>
                      <th className="py-3.5 px-6 font-bold">Due</th>
                      <th className="py-3.5 px-6 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {students.map((st) => {
                      const due = Math.max(0, st.totalFee - st.paidFee);
                      return (
                        <tr key={st.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                          <td className="py-4 px-6 font-bold">
                            {st.name}
                            <span className="block text-[10px] font-mono text-orange-500">{st.enrollmentNo}</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-emerald-500 font-bold">₹{st.paidFee.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-amber-500 font-bold">₹{due.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {due > 0 && (
                              <button
                                onClick={() => handleCollectInstallment(st.id)}
                                className="viq-btn-primary px-3 py-1.5 text-[11px]"
                              >
                                + Collect EMI
                              </button>
                            )}
                            <Link
                              href={`/receipt/${st.id}`}
                              className="inline-flex items-center gap-1 viq-pill px-3 py-1.5 font-mono text-[11px]"
                            >
                              <Receipt className="w-3 h-3 text-orange-500" /> Receipt
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}