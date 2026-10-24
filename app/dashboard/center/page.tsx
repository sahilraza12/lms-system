'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  IndianRupee, 
  CreditCard, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Loader2,
  TrendingUp
} from 'lucide-react';

interface StudentRosterItem {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  user?: { email: string };
  course?: { title: string };
  assignedTeacher?: { fullName: string; teacherCode: string } | null;
  feePlan?: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
  } | null;
}

interface PaymentLog {
  id: string;
  receiptNo: string;
  amount: number;
  mode: string;
  paymentDate: string;
  feePlan: {
    student: {
      fullName: string;
      studentCode: string;
    };
  };
}

interface CenterOverviewData {
  centerInfo: {
    name: string;
    centerCode: string;
    phone: string;
    address: string;
  } | null;
  metrics: {
    studentsCount: number;
    teachersCount: number;
    totalBilled: number;
    totalCollected: number;
    totalBalance: number;
    recoveryRate: number;
  };
  students: StudentRosterItem[];
  recentPayments: PaymentLog[];
}

export default function CenterDashboardPage() {
  const [data, setData] = useState<CenterOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback for development if no session cookie exists
  const currentCenterId = 'default-center-id';

  useEffect(() => {
    const fetchCenterOverview = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/center/overview?centerId=${currentCenterId}`);
        const result = await res.json();
        if (result.success) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load center metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCenterOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-28 bg-slate-200 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { centerInfo, metrics, students, recentPayments } = data || {
    centerInfo: null,
    metrics: { studentsCount: 0, teachersCount: 0, totalBilled: 0, totalCollected: 0, totalBalance: 0, recoveryRate: 100 },
    students: [],
    recentPayments: [],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {centerInfo?.centerCode || 'BRANCH PORTAL'}
            </span>
            <span className="text-xs text-slate-400">Regional Branch Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {centerInfo?.name || 'Branch Operations Hub'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Manage local student admissions, coordinate faculty batches, collect fees, and track branch reconciliation.
          </p>
        </div>

        {/* Quick Operations Links */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/center/fees"
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cashier Desk</span>
          </Link>
          <Link
            href="/dashboard/center/students"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Enroll Student</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Branch Inflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inflow</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{metrics.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
            {metrics.recoveryRate}% Recovery Rate
          </span>
        </div>

        {/* Metric 2: Branch Pending Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Branch Receivables</span>
            <CreditCard className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2 font-mono">
            ₹{metrics.totalBalance.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Billed: ₹{metrics.totalBilled.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Metric 3: Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local Cohort</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {metrics.studentsCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Enrolled Candidates
          </span>
        </div>

        {/* Metric 4: Branch Faculty */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Mentors</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {metrics.teachersCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Assigned Instructors
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Enrollment Roster */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Branch Student Roster</h2>
              <p className="text-xs text-slate-500">Live directory of active students and billing status</p>
            </div>
            <Link
              href="/dashboard/center/fees"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Cashier Desk</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-2.5">Candidate</th>
                  <th className="py-2.5">Course</th>
                  <th className="py-2.5">Assigned Mentor</th>
                  <th className="py-2.5">Outstanding</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No candidates enrolled at this branch yet.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const isPaid = s.feePlan?.status === 'PAID';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5">
                          <span className="font-bold text-slate-900 block">{s.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{s.studentCode}</span>
                        </td>
                        <td className="py-3.5 text-slate-700 font-medium">
                          {s.course?.title || 'Certification Track'}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {s.assignedTeacher?.fullName || 'Unassigned'}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          ₹{s.feePlan?.balance?.toLocaleString('en-IN') ?? 0}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isPaid ? 'CLEARED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Cashier Inflows */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Recent Desk Receipts
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Latest 5</span>
            </div>

            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent receipts recorded.</p>
              ) : (
                recentPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{p.feePlan?.student?.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.receiptNo} • {p.mode}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Contact Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              Branch Metadata
            </h3>
            <div className="text-xs space-y-1.5 text-slate-600">
              <p><strong className="text-slate-800">Address:</strong> {centerInfo?.address || 'Not Configured'}</p>
              <p><strong className="text-slate-800">Phone:</strong> {centerInfo?.phone || 'Not Configured'}</p>
              <p><strong className="text-slate-800">Portal Code:</strong> <span className="font-mono text-orange-600">{centerInfo?.centerCode || 'CEN-00'}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}