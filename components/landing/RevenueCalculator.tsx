'use client';

import { useState } from 'react';
import { Calculator, Building2, TrendingUp, Lock } from 'lucide-react';

interface RevenueCalculatorProps {
  mode?: 'admin' | 'center';
  branchName?: string;
  branchCode?: string;
}

export default function RevenueCalculator({
  mode = 'admin',
  branchName = 'EduNexus Regional Center',
  branchCode = 'CTR-NODE-01',
}: RevenueCalculatorProps) {
  const [studentsPerBranch, setStudentsPerBranch] = useState(100);
  const [avgCourseFee, setAvgCourseFee] = useState(22000);
  const [royaltyPct, setRoyaltyPct] = useState(25);
  const [branchCount, setBranchCount] = useState(mode === 'admin' ? 4 : 1);

  const activeBranches = mode === 'admin' ? branchCount : 1;
  const grossRevenue = studentsPerBranch * avgCourseFee * activeBranches;
  const hqRoyalty = Math.round((grossRevenue * royaltyPct) / 100);
  const centerNetShare = grossRevenue - hqRoyalty;

  return (
    <div className="rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 p-8 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-mono uppercase">
            <Calculator className="w-4 h-4" />
            <span>
              {mode === 'admin'
                ? '[ HQ MULTI-BRANCH REVENUE ENGINE ]'
                : `[ ISOLATED BRANCH CALCULATOR // ${branchCode} ]`}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {mode === 'admin'
              ? 'Global & Per-Branch Financial Simulator'
              : `Revenue & Payout Estimator — ${branchName}`}
          </h3>
        </div>

        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-mono flex items-center gap-1.5 self-start sm:self-auto">
          <Lock className="w-3 h-3 text-emerald-400" />
          {mode === 'admin' ? 'HQ ADMIN ACCESS ONLY' : 'CENTER PARTNER ACCESS ONLY'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-neutral-300">
                {mode === 'admin' ? 'Active Students per Branch' : 'My Branch Student Intake'}
              </span>
              <span className="font-mono font-bold text-orange-400">{studentsPerBranch} Students</span>
            </div>
            <input
              type="range"
              min={15}
              max={400}
              step={5}
              value={studentsPerBranch}
              onChange={(e) => setStudentsPerBranch(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-neutral-300">Average Program Tuition Fee</span>
              <span className="font-mono font-bold text-orange-400">
                ₹{avgCourseFee.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={60000}
              step={1000}
              value={avgCourseFee}
              onChange={(e) => setAvgCourseFee(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {mode === 'admin' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-300">HQ Royalty Split (%)</span>
                  <span className="font-mono font-bold text-amber-300">{royaltyPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={royaltyPct}
                  onChange={(e) => setRoyaltyPct(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-300">Active Franchise Branches</span>
                  <span className="font-mono font-bold text-cyan-400">{branchCount} Branches</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={branchCount}
                  onChange={(e) => setBranchCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-black/80 border border-white/15 p-6 space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-500 block">
              {mode === 'admin' ? 'Projected Gross Network Turnover' : 'My Branch Net Retained Earnings'}
            </span>
            <p className="text-3xl font-black text-white font-mono mt-0.5">
              ₹{(mode === 'admin' ? grossRevenue : centerNetShare).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                HQ Royalty ({royaltyPct}%)
              </span>
              <p className="font-bold text-orange-400 font-mono">
                ₹{hqRoyalty.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                {mode === 'admin' ? 'Franchise Net Retained' : 'Gross Branch Collection'}
              </span>
              <p className="font-bold text-emerald-400 font-mono">
                ₹{(mode === 'admin' ? centerNetShare : grossRevenue).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}