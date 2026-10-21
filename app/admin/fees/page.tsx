'use client';

import { useState } from 'react';
import { Wallet, Search, Receipt } from 'lucide-react';
import Link from 'next/link';

const INITIAL_FEES = [
  { id: 'f-1', student: 'Aarav Verma', branch: 'Khanna HQ', course: 'Full-Stack MERN', total: '₹25,000', paid: '₹25,000', due: '₹0', status: 'CLEARED' },
  { id: 'f-2', student: 'Priya Sharma', branch: 'Ludhiana Node', course: 'Cybersecurity & VAPT', total: '₹20,000', paid: '₹12,000', due: '₹8,000', status: 'EMI_ACTIVE' },
  { id: 'f-3', student: 'Rohan Mehta', branch: 'Chandigarh Node', course: 'AI & Machine Learning', total: '₹28,000', paid: '₹28,000', due: '₹0', status: 'CLEARED' },
];

export default function AdminFeesPage() {
  const [fees] = useState(INITIAL_FEES);
  const [search, setSearch] = useState('');

  const filteredFees = fees.filter(
    (f) =>
      f.student.toLowerCase().includes(search.toLowerCase()) ||
      f.branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Global Fee Ledger & Installments
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Real-time tracking of candidate tuition payments, pending EMIs, and digital receipt issuance.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or branch..."
            className="viq-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>
      </div>

      {/* Fee Table */}
      <div className="viq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                <th className="py-3.5 px-6 font-bold">Candidate Name</th>
                <th className="py-3.5 px-6 font-bold">Branch Node</th>
                <th className="py-3.5 px-6 font-bold">Program</th>
                <th className="py-3.5 px-6 font-bold">Total Fee</th>
                <th className="py-3.5 px-6 font-bold">Paid Amount</th>
                <th className="py-3.5 px-6 font-bold">Balance Due</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                <th className="py-3.5 px-6 text-right font-bold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredFees.map((f) => (
                <tr key={f.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                  <td className="py-4 px-6 font-bold">{f.student}</td>
                  <td className="py-4 px-6 viq-text-secondary font-medium">{f.branch}</td>
                  <td className="py-4 px-6 viq-text-secondary">{f.course}</td>
                  <td className="py-4 px-6 font-mono font-bold">{f.total}</td>
                  <td className="py-4 px-6 font-mono text-emerald-500 font-bold">{f.paid}</td>
                  <td className="py-4 px-6 font-mono text-amber-500 font-bold">{f.due}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                        f.status === 'CLEARED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/receipt/${f.id}`}
                      className="inline-flex items-center gap-1 viq-pill px-3 py-1.5 font-mono text-[11px] font-bold hover:text-orange-500"
                    >
                      <Receipt className="w-3 h-3 text-orange-500" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}