'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  CircleDollarSign,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface MetricSummary {
  centersCount: number;
  studentsCount: number;
  teachersCount: number;
  coursesCount: number;
  totalBilled: number;
  totalCollected: number;
  totalBalance: number;
  recoveryRate: number;
}

interface CenterPerformance {
  id: string;
  name: string;
  centerCode: string;
  studentsCount: number;
  teachersCount: number;
  billed: number;
  collected: number;
  balance: number;
  recoveryRate: number;
}

interface AdminData {
  metrics: MetricSummary;
  topCenters: CenterPerformance[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Revenue projection engine state
  const [calcStudentsPerBranch, setCalcStudentsPerBranch] = useState(120);
  const [calcTuitionFee, setCalcTuitionFee] = useState(25000);
  const [calcRoyaltySplit, setCalcRoyaltySplit] = useState(25);
  const [calcNumBranches, setCalcNumBranches] = useState(2);

  const loadAdminTelemetry = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      // Primary endpoint overview, with graceful fallback to unified fees route
      let res = await fetch('/api/admin/overview', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        res = await fetch('/api/fees?mode=analytics', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
      }

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.metrics && json.topCenters) {
          setData(json);
          if (json.metrics.centersCount) {
            setCalcNumBranches(json.metrics.centersCount);
          }
        } else if (json.stats && json.centerBreakdowns) {
          // Adapt from /api/fees analytics payload format
          const mapped: AdminData = {
            metrics: {
              centersCount: json.centerBreakdowns.length,
              studentsCount: json.centerBreakdowns.reduce(
                (acc: number, c: any) => acc + (Number(c.enrolledCount) || 0),
                0
              ),
              teachersCount: json.centerBreakdowns.length * 2,
              coursesCount: 4,
              totalBilled: Number(json.stats.totalBilled || 0),
              totalCollected: Number(json.stats.totalCollected || 0),
              totalBalance: Number(json.stats.totalBalance || 0),
              recoveryRate: Number(json.stats.overallRecoveryRate || 0),
            },
            topCenters: json.centerBreakdowns.map((c: any) => ({
              id: c.id,
              name: c.name,
              centerCode: c.code,
              studentsCount: Number(c.enrolledCount || 0),
              teachersCount: 2,
              billed: Number(c.billed || 0),
              collected: Number(c.collected || 0),
              balance: Number(c.balance || 0),
              recoveryRate: Number(c.recoveryRate || 0),
            })),
          };
          setData(mapped);
          setCalcNumBranches(mapped.metrics.centersCount || 2);
        }
      }
    } catch (error) {
      console.error('Failed to load administrative telemetry:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminTelemetry();
  }, [loadAdminTelemetry]);

  // Dynamic Metrics Filtered by Selected Branch
  const filteredMetrics = useMemo(() => {
    if (!data) {
      return {
        billed: 0,
        collected: 0,
        balance: 0,
        students: 0,
        centersCount: 0,
        recoveryRate: 0,
      };
    }

    if (selectedBranch === 'ALL') {
      return {
        billed: data.metrics.totalBilled,
        collected: data.metrics.totalCollected,
        balance: data.metrics.totalBalance,
        students: data.metrics.studentsCount,
        centersCount: data.metrics.centersCount,
        recoveryRate: data.metrics.recoveryRate,
      };
    }

    const branch = data.topCenters.find((c) => c.id === selectedBranch);
    if (!branch) {
      return {
        billed: data.metrics.totalBilled,
        collected: data.metrics.totalCollected,
        balance: data.metrics.totalBalance,
        students: data.metrics.studentsCount,
        centersCount: 1,
        recoveryRate: data.metrics.recoveryRate,
      };
    }

    return {
      billed: branch.billed,
      collected: branch.collected,
      balance: branch.balance,
      students: branch.studentsCount,
      centersCount: 1,
      recoveryRate: branch.recoveryRate,
    };
  }, [data, selectedBranch]);

  // Dynamic Table Rows Filtered
  const filteredCenters = useMemo(() => {
    if (!data?.topCenters) return [];
    if (selectedBranch === 'ALL') return data.topCenters;
    return data.topCenters.filter((c) => c.id === selectedBranch);
  }, [data, selectedBranch]);

  // Projection Engine Calculations
  const projectedGross = useMemo(() => {
    return calcStudentsPerBranch * calcTuitionFee * calcNumBranches;
  }, [calcStudentsPerBranch, calcTuitionFee, calcNumBranches]);

  const hqRoyaltyCut = useMemo(() => {
    return Math.round((projectedGross * calcRoyaltySplit) / 100);
  }, [projectedGross, calcRoyaltySplit]);

  const branchNetShare = useMemo(() => {
    return projectedGross - hqRoyaltyCut;
  }, [projectedGross, hqRoyaltyCut]);

  return (
    <div className="w-full flex-1 flex flex-col min-w-0 bg-[#07090E] text-slate-100 min-h-screen">
      
      {/* Desktop-Only Sub-Telemetry Bar */}
      <div className="hidden lg:flex items-center justify-between px-8 py-3.5 border-b border-white/10 bg-[#0D111A]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-orange-500 font-bold">[</span>
          <span className="text-slate-200 font-semibold tracking-wider">HQ EXECUTIVE TELEMETRY // ALL FRANCHISE NODES</span>
          <span className="text-orange-500 font-bold">]</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE LEDGER SYNC</span>
          </div>

          <button
            type="button"
            onClick={() => void loadAdminTelemetry(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reload Database Figures"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          <ThemeToggle />
        </div>
      </div>

      {/* Main Dashboard Canvas */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Header Row: Title & Scope Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Executive Command & Revenue Engine</span>
              <Sparkles className="w-5 h-5 text-orange-400 shrink-0" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Monitor total network cashflow, student intake metrics, or isolate any individual branch ledger in real time.
            </p>
          </div>

          <div className="w-full sm:w-auto relative">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-auto appearance-none px-4 py-2.5 pr-9 rounded-xl bg-[#0D111A] border border-white/10 text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">All Branches (Total Network)</option>
              {data?.topCenters?.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name} ({center.centerCode})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Metric KPI Cards (Responsive to Selected Branch) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 shadow-md space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                Gross Collected Revenue
              </span>
              <CircleDollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ₹{loading ? '...' : filteredMetrics.collected.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-mono text-emerald-400 font-bold block">
              {selectedBranch === 'ALL'
                ? `Across ${filteredMetrics.centersCount} Active Centers`
                : 'Current Branch Total'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D111A] border border-orange-500/30 shadow-md space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400">
                HQ Royalty Cut
              </span>
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-500 font-mono tracking-tight">
              ₹{loading ? '...' : Math.round(filteredMetrics.collected * 0.25).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 block font-medium">Direct Institutional Share (25%)</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 shadow-md space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                Enrolled Candidates
              </span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {loading ? '...' : filteredMetrics.students}
            </p>
            <span className="text-[11px] text-slate-400 block font-medium">Active Batch Roster</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D111A] border border-white/10 shadow-md space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Pending EMI Receivable
              </span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ₹{loading ? '...' : filteredMetrics.balance.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 block font-medium">Scheduled Installments</span>
          </div>
        </div>

        {/* Projection Engine Calculator */}
        <div className="p-5 sm:p-7 rounded-3xl bg-[#0D111A] border border-white/10 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                [ ADMIN EXCLUSIVE // FINANCIAL PROJECTION ENGINE ]
              </span>
              <h2 className="text-lg font-black text-white tracking-tight mt-1 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <span>Total Multi-Branch Revenue Calculator</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Students per Branch</span>
                  <span className="text-orange-400 font-mono font-bold">{calcStudentsPerBranch} Candidates</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={calcStudentsPerBranch}
                  onChange={(e) => setCalcStudentsPerBranch(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Average Program Tuition Fee</span>
                  <span className="text-orange-400 font-mono font-bold">₹{calcTuitionFee.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={calcTuitionFee}
                  onChange={(e) => setCalcTuitionFee(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">HQ Royalty Split (%)</span>
                    <span className="text-orange-400 font-mono font-bold">{calcRoyaltySplit}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={calcRoyaltySplit}
                    onChange={(e) => setCalcRoyaltySplit(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Number of Branches</span>
                    <span className="text-orange-400 font-mono font-bold">{calcNumBranches} Centers</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={calcNumBranches}
                    onChange={(e) => setCalcNumBranches(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                  PROJECTED GROSS TURNOVER
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-1">
                  ₹{projectedGross.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">HQ ROYALTY ({calcRoyaltySplit}%)</span>
                  <p className="text-base sm:text-lg font-black font-mono text-orange-500 mt-0.5">
                    ₹{hqRoyaltyCut.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">BRANCH NET SHARE</span>
                  <p className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
                    ₹{branchNetShare.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Franchise Centers Performance Table */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0D111A] border border-white/10 shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Regional Franchise Performance Nodes</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {filteredCenters.length} {filteredCenters.length === 1 ? 'Branch' : 'Branches'} Displayed
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs min-w-[620px]">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <th className="py-3 px-4">Center Specification</th>
                  <th className="py-3 px-4">Cohort Size</th>
                  <th className="py-3 px-4">Billed Revenue</th>
                  <th className="py-3 px-4">Collected</th>
                  <th className="py-3 px-4 text-right">Recovery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredCenters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                      No franchise branches found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredCenters.map((center) => (
                    <tr key={center.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-sans">
                        <p className="font-bold text-white">{center.name}</p>
                        <p className="text-[10px] font-mono text-orange-400">{center.centerCode}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {center.studentsCount} Students / {center.teachersCount} Faculty
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        ₹{center.billed.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ₹{center.collected.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] ${
                          center.recoveryRate >= 75
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {center.recoveryRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}