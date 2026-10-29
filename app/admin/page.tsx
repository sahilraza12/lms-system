'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wallet, 
  Award, 
  Calculator, 
  TrendingUp, 
  ArrowUpRight, 
  Filter,
  RefreshCw,
  Building2,
  CheckCircle2
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

interface ApiCenterStudent {
  feePlan?: {
    totalAmount?: number;
    paidAmount?: number;
    balance?: number;
  } | null;
}

interface ApiCenterRecord {
  id: string;
  name: string;
  centerCode: string;
  royaltyRate?: number;
  address?: string | null;
  studentsCount?: number;
  _count?: { students?: number; teachers?: number };
  students?: ApiCenterStudent[];
  collected?: number;
  balance?: number;
  billed?: number;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [royaltyDrafts, setRoyaltyDrafts] = useState<Record<string, string>>({});
  const [savingRoyaltyId, setSavingRoyaltyId] = useState<string | null>(null);
  const [royaltyError, setRoyaltyError] = useState('');

  // Interactive Revenue Simulator States
  const [simStudents, setSimStudents] = useState<number>(120);
  const [simAvgFee, setSimAvgFee] = useState<number>(20000);
  const [simRoyaltyPct, setSimRoyaltyPct] = useState<number>(25);
  const [simBranchCount, setSimBranchCount] = useState<number>(2);

  // Resilient telemetry fetcher with dual-endpoint fallback
  const loadAdminTelemetry = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      
      // Attempt primary admin overview telemetry endpoint first
      let res = await fetch('/api/admin/overview', { cache: 'no-store' });
      
      // Fallback to centers registry endpoint if overview is unavailable
      if (!res.ok) {
        res = await fetch('/api/admin/centers', { cache: 'no-store' });
      }

      if (res.ok) {
        const data = await res.json();
        
        // Handle both response shapes: { topCenters } or { centers }
        const centerList: ApiCenterRecord[] = data.topCenters || data.centers || [];
        
        if (Array.isArray(centerList) && centerList.length > 0) {
          const mapped: BranchMetric[] = centerList.map((c, idx) => {
            let collected = Number(c.collected ?? 0);
            let pending = Number(c.balance ?? 0);

            // Compute ledger aggregates dynamically if raw student fee plans are present
            if (c.students && Array.isArray(c.students)) {
              collected = 0;
              pending = 0;
              c.students.forEach((s) => {
                if (s.feePlan) {
                  collected += Number(s.feePlan.paidAmount ?? 0);
                  pending += Number(s.feePlan.balance ?? 0);
                }
              });
            }

            return {
              id: c.id || `br-${idx}`,
              name: c.name || `Center Node ${idx + 1}`,
              code: c.centerCode || `VIQ-0${idx + 1}`,
              city: c.address || 'Active Branch',
              studentsCount: Number(c.studentsCount ?? c._count?.students ?? 0),
              collectedRevenue: collected,
              pendingFees: pending,
              royaltyRate: Number(c.royaltyRate ?? 25),
            };
          });

          setBranches(mapped);
          setRoyaltyDrafts({});
          setSimBranchCount(mapped.length || 2);
        }
      }
    } catch (err: unknown) {
      console.warn('Administrative telemetry fetch failed, maintaining active cache:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAdminTelemetry();
  }, []);

  const saveRoyaltyRate = async (branch: BranchMetric) => {
    const royaltyRate = Number(royaltyDrafts[branch.id] ?? branch.royaltyRate);
    if (!Number.isInteger(royaltyRate) || royaltyRate < 0 || royaltyRate > 100) {
      setRoyaltyError('Royalty rate must be a whole number between 0 and 100.');
      return;
    }

    setSavingRoyaltyId(branch.id);
    setRoyaltyError('');
    try {
      const res = await fetch(`/api/admin/centers/${branch.id}/royalty-rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ royaltyRate }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save royalty rate.');
      }

      setBranches((current) =>
        current.map((item) =>
          item.id === branch.id ? { ...item, royaltyRate: data.center.royaltyRate } : item
        )
      );
      setRoyaltyDrafts((current) => {
        const next = { ...current };
        delete next[branch.id];
        return next;
      });
    } catch (error: unknown) {
      setRoyaltyError(error instanceof Error ? error.message : 'Failed to save royalty rate.');
    } finally {
      setSavingRoyaltyId(null);
    }
  };

  // Filtered branches depending on dropdown isolation
  const activeBranches = useMemo(() => {
    return selectedBranchId === 'ALL'
      ? branches
      : branches.filter((b) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Aggregate telemetry sums
  const totalStudents = useMemo(() => {
    return activeBranches.reduce((sum, b) => sum + (Number(b.studentsCount) || 0), 0);
  }, [activeBranches]);

  const totalCollected = useMemo(() => {
    return activeBranches.reduce((sum, b) => sum + (Number(b.collectedRevenue) || 0), 0);
  }, [activeBranches]);

  const totalPending = useMemo(() => {
    return activeBranches.reduce((sum, b) => sum + (Number(b.pendingFees) || 0), 0);
  }, [activeBranches]);

  const totalHqRoyalty = useMemo(() => {
    return activeBranches.reduce(
      (sum, b) => sum + Math.round(((Number(b.collectedRevenue) || 0) * (b.royaltyRate ?? 25)) / 100),
      0
    );
  }, [activeBranches]);

  // Projection Engine Calculations
  const singleBranchGross = simStudents * simAvgFee;
  const networkGross = singleBranchGross * (selectedBranchId === 'ALL' ? simBranchCount : 1);
  const hqRoyaltyShare = Math.round((networkGross * simRoyaltyPct) / 100);
  const centerNetRetained = networkGross - hqRoyaltyShare;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0">
      
      {/* 1. Header & Branch Scope Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Executive Command & Revenue Engine</span>
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Monitor total network cashflow or isolate any individual branch ledger in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => void loadAdminTelemetry(true)}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-secondary)] text-slate-300 transition shrink-0 cursor-pointer"
            title="Refresh Ledger Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <div className="flex items-center gap-2 viq-pill px-3 py-2 flex-1 md:flex-none">
            <Filter className="w-4 h-4 text-orange-500 shrink-0" />
            <div className="text-xs w-full">
              <span className="viq-text-muted font-mono block text-[9px] uppercase font-bold tracking-wider">
                Inspecting Scope
              </span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-bold outline-none cursor-pointer w-full text-xs"
              >
                <option value="ALL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  All Branches (Total Network)
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Collected */}
        <div className="viq-card p-5 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Gross Collected Revenue</span>
            <Wallet className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black font-mono">
            ₹{loading ? '...' : totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono text-emerald-500 block font-bold">
            {selectedBranchId === 'ALL' ? `Across ${branches.length} Active Centers` : 'Isolated Branch Ledger'}
          </span>
        </div>

        {/* HQ Royalty */}
        <div className="viq-card p-5 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>HQ Royalty Cut</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-orange-500 font-mono">
            ₹{loading ? '...' : totalHqRoyalty.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Total share based on center-specific deals
          </span>
        </div>

        {/* Enrolled Students */}
        <div className="viq-card p-5 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Enrolled Candidates</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black font-mono">
            {loading ? '...' : totalStudents}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Active Batch Roster
          </span>
        </div>

        {/* Pending EMI */}
        <div className="viq-card p-5 space-y-2">
          <div className="flex items-center justify-between viq-text-secondary text-xs font-bold">
            <span>Pending EMI Receivable</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono">
            ₹{loading ? '...' : totalPending.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-mono viq-text-muted block font-bold">
            Scheduled Installments
          </span>
        </div>

      </div>

      {/* 3. Interactive Multi-Branch Revenue Simulator */}
      <div className="viq-card p-5 sm:p-7 space-y-6 bg-[var(--bg-glass-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-mono uppercase font-bold">
              <Calculator className="w-4 h-4 shrink-0" />
              <span>[ ADMIN EXCLUSIVE // FINANCIAL PROJECTION ENGINE ]</span>
            </div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              {selectedBranchId === 'ALL'
                ? 'Total Multi-Branch Revenue Calculator'
                : `Branch Revenue Simulator: ${activeBranches[0]?.name || 'Selected Center'}`}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Sliders Area */}
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
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
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
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {selectedBranchId === 'ALL' && (
                <div>
                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="viq-text-secondary">Number of Branches</span>
                    <span className="font-mono text-indigo-400">{simBranchCount} Centers</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={simBranchCount}
                    onChange={(e) => setSimBranchCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="lg:col-span-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                Projected Gross Turnover
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-[var(--text-primary)]">
                ₹{networkGross.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
              <div>
                <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                  HQ Royalty ({simRoyaltyPct}%)
                </span>
                <p className="text-base sm:text-lg font-black text-orange-500 font-mono mt-0.5">
                  ₹{hqRoyaltyShare.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">
                  Branch Net Share
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-500 font-mono mt-0.5">
                  ₹{centerNetRetained.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Branch Financial Matrix (Mobile Cards + Desktop Table) */}
      <div className="viq-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black">Branch-by-Branch Financial Matrix</h3>
            <p className="text-xs viq-text-secondary">Click isolate on any branch to filter telemetry.</p>
          </div>
          <Link
            href="/admin/centers"
            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            <span>Manage Centers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {royaltyError && (
          <p role="alert" className="px-4 sm:px-6 py-3 text-xs font-semibold text-red-400">
            {royaltyError}
          </p>
        )}

        {/* Mobile View: Stacked Cards (< 768px) */}
        <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
          {activeBranches.map((branch) => {
            const branchRoyalty = Math.round((branch.collectedRevenue * branch.royaltyRate) / 100);
            return (
              <div 
                key={branch.id} 
                className="p-4 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{branch.name}</h4>
                    <span className="text-[10px] font-mono text-orange-500">{branch.code}</span>
                  </div>
                  <button
                    onClick={() => setSelectedBranchId(selectedBranchId === branch.id ? 'ALL' : branch.id)}
                    className="viq-pill px-2.5 py-1 font-mono text-[10px] font-bold"
                  >
                    {selectedBranchId === branch.id ? 'Show All' : 'Isolate'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border-color)] font-mono">
                  <div>
                    <span className="viq-text-muted text-[10px] block">COLLECTED</span>
                    <span className="font-bold text-emerald-500">₹{branch.collectedRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="viq-text-muted text-[10px] block">PENDING</span>
                    <span className="font-bold text-amber-500">₹{branch.pendingFees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="viq-text-muted text-[10px] block">HQ ROYALTY ({branch.royaltyRate}%)</span>
                    <span className="font-bold text-orange-500">₹{branchRoyalty.toLocaleString('en-IN')}</span>
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        aria-label={`Royalty rate for ${branch.name}`}
                        value={royaltyDrafts[branch.id] ?? String(branch.royaltyRate)}
                        onChange={(event) =>
                          setRoyaltyDrafts((current) => ({ ...current, [branch.id]: event.target.value }))
                        }
                        className="w-16 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] px-1.5 py-1 text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => void saveRoyaltyRate(branch)}
                        disabled={savingRoyaltyId === branch.id}
                        className="rounded bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-500 disabled:opacity-50"
                      >
                        {savingRoyaltyId === branch.id ? 'Saving' : 'Save %'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="viq-text-muted text-[10px] block">STUDENTS</span>
                    <span className="font-bold text-[var(--text-primary)]">{branch.studentsCount} Active</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Multi-Column Table (md: and above) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                <th className="py-3.5 px-6 font-bold">Branch Name & Code</th>
                <th className="py-3.5 px-6 font-bold">City / Location</th>
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
                      <div>₹{branchRoyalty.toLocaleString('en-IN')} ({branch.royaltyRate}%)</div>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          aria-label={`Royalty rate for ${branch.name}`}
                          value={royaltyDrafts[branch.id] ?? String(branch.royaltyRate)}
                          onChange={(event) =>
                            setRoyaltyDrafts((current) => ({ ...current, [branch.id]: event.target.value }))
                          }
                          className="w-16 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] px-1.5 py-1 text-xs text-[var(--text-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => void saveRoyaltyRate(branch)}
                          disabled={savingRoyaltyId === branch.id}
                          className="rounded bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-500 disabled:opacity-50"
                        >
                          {savingRoyaltyId === branch.id ? 'Saving' : 'Save'}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedBranchId(selectedBranchId === branch.id ? 'ALL' : branch.id)}
                        className="viq-pill px-3 py-1.5 font-mono text-[11px] font-bold hover:border-orange-500 hover:text-orange-500 transition cursor-pointer"
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