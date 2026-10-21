'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wallet, 
  Award, 
  Calculator, 
  TrendingUp, 
  ArrowUpRight, 
  Filter 
} from 'lucide-react';

interface BranchMetric {
  id: string;
  name: string;
  code: string;
  city: string;
  studentsCount: number;
  collectedRevenue: number;
  pendingFees: number;
  royaltyRate: number;
}

const DEFAULT_BRANCHES: BranchMetric[] = [
  {
    id: 'br-1',
    name: 'VIQ Technologies - Khanna HQ',
    code: 'VIQ-KHN-01',
    city: 'Khanna',
    studentsCount: 145,
    collectedRevenue: 2610000,
    pendingFees: 340000,
    royaltyRate: 25,
  },
  {
    id: 'br-2',
    name: 'VIQ Technologies - Ludhiana Node',
    code: 'VIQ-LDH-02',
    city: 'Ludhiana',
    studentsCount: 110,
    collectedRevenue: 2090000,
    pendingFees: 215000,
    royaltyRate: 25,
  },
];

export default function AdminDashboardPage() {
  const [branches, setBranches] = useState<BranchMetric[]>(DEFAULT_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  // Interactive Revenue Simulator States
  const [simStudents, setSimStudents] = useState<number>(120);
  const [simAvgFee, setSimAvgFee] = useState<number>(20000);
  const [simRoyaltyPct, setSimRoyaltyPct] = useState<number>(25);
  const [simBranchCount, setSimBranchCount] = useState<number>(2);

  useEffect(() => {
    async function loadAdminTelemetry() {
      try {
        const res = await fetch('/api/centers');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.centers || [];
          if (list.length > 0) {
            const mapped: BranchMetric[] = list.map((c: any, idx: number) => ({
              id: c.id || `br-${idx}`,
              name: c.name || `Branch ${idx + 1}`,
              code: c.code || `VIQ-0${idx + 1}`,
              city: c.city || c.location || 'Active Node',
              studentsCount: Number(c.studentsCount || c._count?.students || 85),
              collectedRevenue: Number(c.collectedRevenue || 1540000),
              pendingFees: Number(c.pendingFees || 180000),
              royaltyRate: 25,
            }));
            setBranches(mapped);
          }
        }
      } catch {
        // Fallback branches stay active
      }
    }
    loadAdminTelemetry();
  }, []);

  const activeBranches = selectedBranchId === 'ALL'
      ? branches
      : branches.filter((b) => b.id === selectedBranchId);

  const totalStudents = activeBranches.reduce((sum, b) => sum + b.studentsCount, 0);
  const totalCollected = activeBranches.reduce((sum, b) => sum + b.collectedRevenue, 0);
  const totalPending = activeBranches.reduce((sum, b) => sum + b.pendingFees, 0);
  const totalHqRoyalty = activeBranches.reduce(
    (sum, b) => sum + Math.round((b.collectedRevenue * b.royaltyRate) / 100), 0
  );

  const singleBranchGross = simStudents * simAvgFee;
  const networkGross = singleBranchGross * (selectedBranchId === 'ALL' ? simBranchCount : 1);
  const hqRoyaltyShare = Math.round((networkGross * simRoyaltyPct) / 100);
  const centerNetRetained = networkGross - hqRoyaltyShare;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header + Independent Branch Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Executive Command & Revenue Engine
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Monitor total network cashflow or isolate any individual branch ledger in real time.
          </p>
        </div>

        {/* Branch Scope Selector */}
        <div className="flex items-center gap-3 viq-pill px-4 py-2.5">
          <Filter className="w-4 h-4 text-orange-500 shrink-0" />
          <div className="text-xs">
            <span className="viq-text-muted font-mono block text-[10px] uppercase font-bold">
              Inspecting Scope
            </span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-bold outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                🌐 All Branches (Total Network)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  🏢 {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Key Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="viq-card p-6 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Gross Collected Revenue</span>
            <Wallet className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono text-emerald-500 block font-bold">
            {selectedBranchId === 'ALL' ? `Across ${branches.length} Active Centers` : 'Isolated Branch Ledger'}
          </span>
        </div>

        <div className="viq-card p-6 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>HQ Royalty Cut</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-orange-500 font-mono">
            ₹{totalHqRoyalty.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Direct Institutional Share
          </span>
        </div>

        <div className="viq-card p-6 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Enrolled Candidates</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black font-mono">
            {totalStudents}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Active Batch Roster
          </span>
        </div>

        <div className="viq-card p-6 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Pending EMI Receivable</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono">
            ₹{totalPending.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Scheduled Installments
          </span>
        </div>
      </div>

      {/* Admin Exclusive Multi-Branch Revenue Calculator */}
      <div className="viq-card p-8 space-y-8 bg-[var(--bg-glass-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-orange-500 text-xs font-mono uppercase font-bold">
              <Calculator className="w-4 h-4" />
              <span>[ ADMIN EXCLUSIVE // FINANCIAL PROJECTION ENGINE ]</span>
            </div>
            <h2 className="text-xl font-black">
              {selectedBranchId === 'ALL'
                ? 'Total Multi-Branch Revenue Calculator'
                : `Branch Revenue Simulator: ${activeBranches[0]?.name}`}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-2 font-bold">
                <span className="viq-text-secondary">Students per Branch</span>
                <span className="font-mono text-orange-500">{simStudents} Candidates</span>
              </div>
              <input
                type="range"
                min={20}
                max={500}
                step={10}
                value={simStudents}
                onChange={(e) => setSimStudents(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2 font-bold">
                <span className="viq-text-secondary">Average Program Tuition Fee</span>
                <span className="font-mono text-orange-500">₹{simAvgFee.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={60000}
                step={1000}
                value={simAvgFee}
                onChange={(e) => setSimAvgFee(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-2 font-bold">
                  <span className="viq-text-secondary">HQ Royalty Split (%)</span>
                  <span className="font-mono text-amber-500">{simRoyaltyPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={simRoyaltyPct}
                  onChange={(e) => setSimRoyaltyPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {selectedBranchId === 'ALL' && (
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="viq-text-secondary">Number of Branches</span>
                    <span className="font-mono text-indigo-500">{simBranchCount} Centers</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={simBranchCount}
                    onChange={(e) => setSimBranchCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                Projected Gross Turnover
              </span>
              <p className="text-3xl font-black font-mono mt-0.5">
                ₹{networkGross.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
              <div>
                <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                  HQ Royalty ({simRoyaltyPct}%)
                </span>
                <p className="text-lg font-black text-orange-500 font-mono">
                  ₹{hqRoyaltyShare.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                  Branch Net Share
                </span>
                <p className="text-lg font-black text-emerald-500 font-mono">
                  ₹{centerNetRetained.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Independent Branch Breakdown Table */}
      <div className="viq-card overflow-hidden">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-black">Branch-by-Branch Financial Matrix</h3>
            <p className="text-xs viq-text-secondary">Click any branch in the top filter to isolate its metrics.</p>
          </div>
          <Link
            href="/admin/centers"
            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            <span>Manage Centers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                <th className="py-3.5 px-6 font-bold">Branch Name & Code</th>
                <th className="py-3.5 px-6 font-bold">City</th>
                <th className="py-3.5 px-6 font-bold">Students</th>
                <th className="py-3.5 px-6 font-bold">Collected Fee</th>
                <th className="py-3.5 px-6 font-bold">Pending EMI</th>
                <th className="py-3.5 px-6 font-bold">HQ Royalty</th>
                <th className="py-3.5 px-6 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {activeBranches.map((branch) => {
                const branchRoyalty = Math.round((branch.collectedRevenue * branch.royaltyRate) / 100);
                return (
                  <tr key={branch.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                    <td className="py-4 px-6 font-bold">
                      {branch.name}
                      <span className="block text-[10px] font-mono text-orange-500">{branch.code}</span>
                    </td>
                    <td className="py-4 px-6 viq-text-secondary font-semibold">{branch.city}</td>
                    <td className="py-4 px-6 font-mono font-bold">{branch.studentsCount}</td>
                    <td className="py-4 px-6 font-mono text-emerald-500 font-bold">
                      ₹{branch.collectedRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-500 font-bold">
                      ₹{branch.pendingFees.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-mono text-orange-500 font-bold">
                      ₹{branchRoyalty.toLocaleString('en-IN')} ({branch.royaltyRate}%)
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedBranchId(selectedBranchId === branch.id ? 'ALL' : branch.id)}
                        className="viq-pill px-3 py-1.5 font-mono text-[11px] font-bold hover:border-orange-500 hover:text-orange-500 transition"
                      >
                        {selectedBranchId === branch.id ? 'Show All' : 'Isolate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}