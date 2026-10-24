'use client';

import { useEffect, useState } from 'react';

interface CenterStat {
  id: string;
  name: string;
  code: string;
  enrolledCount: number;
  billed: number;
  collected: number;
  balance: number;
  recoveryRate: number;
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
      center?: { name: string; centerCode: string } | null;
    };
  };
}

export default function AdminFeesPage() {
  const [stats, setStats] = useState({
    totalBilled: 0,
    totalCollected: 0,
    totalBalance: 0,
    overallRecoveryRate: 0,
  });
  const [centers, setCenters] = useState<CenterStat[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinancials = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/fees');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setCenters(data.centerBreakdowns);
          setRecentPayments(data.recentPayments);
        }
      } catch (err) {
        console.error('Failed to load financial overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Consolidated Financials & Revenue Desk</h1>
        <p className="text-sm text-slate-500">
          Executive billing aggregates, branch collection benchmarks, and real-time payment audit trails.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed Volume</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{stats.totalBilled.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Sum across all courses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
            {stats.overallRecoveryRate}% Overall Clearance
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Receivable</span>
          <p className="text-2xl font-black text-orange-600 mt-2 font-mono">
            ₹{stats.totalBalance.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Pending across active EMIs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operational Branches</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {centers.length}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Active regional centers</span>
        </div>
      </div>

      {/* Center Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Branch Performance & Recovery Benchmark</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-3.5">Center Branch</th>
                <th className="px-6 py-3.5">Enrolled Students</th>
                <th className="px-6 py-3.5">Billed</th>
                <th className="px-6 py-3.5">Collected</th>
                <th className="px-6 py-3.5">Pending Dues</th>
                <th className="px-6 py-3.5">Recovery %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Aggregating ledger data across centers...
                  </td>
                </tr>
              ) : centers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No active center billing records found.
                  </td>
                </tr>
              ) : (
                centers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-xs font-mono text-slate-400">{c.code}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {c.enrolledCount} Students
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      ₹{c.billed.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                      ₹{c.collected.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-orange-600">
                      ₹{c.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${Math.min(c.recoveryRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          {c.recoveryRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Central Inflow Stream */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Live Inflow Stream (Last 15 Payments)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-3.5">Receipt No</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Center Branch</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400">
                    No transactions captured yet.
                  </td>
                </tr>
              ) : (
                recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 text-xs">
                      {p.receiptNo}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {p.feePlan?.student?.fullName}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {p.feePlan?.student?.studentCode}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
                      {p.feePlan?.student?.center?.name || 'Central Head'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.mode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {new Date(p.paymentDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-600">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}