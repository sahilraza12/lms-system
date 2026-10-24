'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Wallet, 
  Search, 
  Receipt, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  X, 
  CreditCard, 
  Building2, 
  User, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

interface FeeLedgerEntry {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  branchName: string;
  courseName: string;
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  latestReceiptId?: string | null;
  status: 'CLEARED' | 'EMI_ACTIVE' | 'UNPAID';
}

export default function AdminFeesPage() {
  const searchParams = useSearchParams();
  const [fees, setFees] = useState<FeeLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLEARED' | 'EMI_ACTIVE' | 'UNPAID'>('ALL');

  // Cashier Desk Drawer / Modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FeeLedgerEntry | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(5000);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'NET_BANKING'>('UPI');
  const [referenceNote, setReferenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Load live ledger records from API
  const loadLedger = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/admin/fees', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.ledger)) {
          setFees(json.ledger);
          return;
        }
      }
      
      // Fallback: If dedicated fee endpoint is pending, construct from student records
      const studentRes = await fetch('/api/students', { cache: 'no-store' });
      if (studentRes.ok) {
        const studentJson = await studentRes.json();
        const list = Array.isArray(studentJson) ? studentJson : studentJson.students || [];
        const mapped: FeeLedgerEntry[] = list.map((s: any, idx: number) => {
          const total = s.feePlan?.totalAmount ?? 25000;
          const paid = s.feePlan?.paidAmount ?? 0;
          const balance = total - paid;
          return {
            id: s.feePlan?.id || `f-${idx}`,
            studentId: s.id,
            studentName: s.name || s.fullName || 'Candidate',
            enrollmentNo: s.enrollmentNo || s.studentCode || `VIQ-2026-${100 + idx}`,
            branchName: s.center?.name || s.branchName || 'VIQ Technologies - Khanna HQ',
            courseName: s.course?.name || s.courseName || 'Full-Stack Web Development',
            totalFee: total,
            paidAmount: paid,
            balanceDue: balance,
            latestReceiptId: s.receipts?.[0]?.id || null,
            status: balance <= 0 ? 'CLEARED' : paid > 0 ? 'EMI_ACTIVE' : 'UNPAID',
          };
        });
        setFees(mapped);
      }
    } catch (err) {
      console.warn('Ledger query exception, retaining active state:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  // Handle URL pre-fill from Candidate Roster redirection
  useEffect(() => {
    const studentIdParam = searchParams.get('studentId');
    const nameParam = searchParams.get('name');
    const enrollmentParam = searchParams.get('enrollmentNo');

    if (studentIdParam && nameParam) {
      const existing = fees.find((f) => f.studentId === studentIdParam);
      if (existing) {
        setSelectedStudent(existing);
        setCollectionAmount(existing.balanceDue > 0 ? existing.balanceDue : 5000);
      } else {
        setSelectedStudent({
          id: `draft-${Date.now()}`,
          studentId: studentIdParam,
          studentName: nameParam,
          enrollmentNo: enrollmentParam || 'NEW-ADMISSION',
          branchName: 'VIQ Technologies - Khanna HQ',
          courseName: 'Full-Stack Web Development',
          totalFee: 25000,
          paidAmount: 0,
          balanceDue: 25000,
          status: 'UNPAID',
        });
        setCollectionAmount(5000);
      }
      setIsCollectModalOpen(true);
    }
  }, [searchParams, fees]);

  // Execute payment transaction & generate official receipt voucher
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || collectionAmount <= 0) return;

    setActionError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          amount: Number(collectionAmount),
          paymentMode,
          referenceNote,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Payment execution failed.');
      }

      setIsCollectModalOpen(false);
      setSelectedStudent(null);
      setReferenceNote('');
      await loadLedger();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Server error processing transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFees = fees.filter((f) => {
    const query = search.toLowerCase();
    const matchesSearch =
      f.studentName.toLowerCase().includes(query) ||
      f.enrollmentNo.toLowerCase().includes(query) ||
      f.branchName.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0 font-sans">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Global Fee Ledger & Installments</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {loading ? '...' : `${fees.length} Account Records`}
            </span>
          </h1>
          <p className="text-xs sm:text-sm viq-text-secondary mt-1">
            Real-time tracking of candidate tuition payments, pending EMIs, and digital receipt issuance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadLedger(true)}
            className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-secondary)] text-slate-300 transition cursor-pointer"
            title="Sync Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, enrollment ID, or branch..."
            className="viq-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'CLEARED', 'EMI_ACTIVE', 'UNPAID'] as const).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setStatusFilter(filterKey)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer ${
                statusFilter === filterKey
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'viq-pill text-slate-400 hover:text-white'
              }`}
            >
              {filterKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Fee Ledger Table Container */}
      {loading ? (
        <div className="py-20 text-center viq-card border border-[var(--border-color)] rounded-2xl space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-orange-500" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Synchronizing institutional fee ledger...
          </p>
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="py-16 text-center viq-card border border-dashed border-[var(--border-color)] rounded-2xl space-y-2">
          <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No Ledger Entries Found</p>
          <p className="text-xs viq-text-muted">
            {search ? 'No payments match your search filter.' : 'New enrollments will automatically populate here.'}
          </p>
        </div>
      ) : (
        <div className="viq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                  <th className="py-3.5 px-6 font-bold">Candidate & ID</th>
                  <th className="py-3.5 px-6 font-bold">Branch Node</th>
                  <th className="py-3.5 px-6 font-bold">Program</th>
                  <th className="py-3.5 px-6 font-bold">Total Fee</th>
                  <th className="py-3.5 px-6 font-bold">Paid Amount</th>
                  <th className="py-3.5 px-6 font-bold">Balance Due</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredFees.map((f) => (
                  <tr key={f.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                    <td className="py-4 px-6 font-bold">
                      {f.studentName}
                      <span className="block text-[10px] font-mono text-orange-500 mt-0.5">{f.enrollmentNo}</span>
                    </td>
                    <td className="py-4 px-6 viq-text-secondary font-medium">{f.branchName}</td>
                    <td className="py-4 px-6 viq-text-secondary">{f.courseName}</td>
                    <td className="py-4 px-6 font-mono font-bold">₹{f.totalFee.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 font-mono text-emerald-500 font-bold">₹{f.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 font-mono text-amber-500 font-bold">₹{f.balanceDue.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                          f.status === 'CLEARED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : f.status === 'EMI_ACTIVE'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {/* Collect installment button */}
                      {f.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(f);
                            setCollectionAmount(f.balanceDue > 10000 ? 5000 : f.balanceDue);
                            setIsCollectModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-amber-500" />
                          <span>Collect</span>
                        </button>
                      )}

                      {/* Receipt Link: Only rendered when valid voucher ID exists */}
                      {f.latestReceiptId ? (
                        <Link
                          href={`/receipt/${f.latestReceiptId}`}
                          className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] text-orange-400 border-orange-500/30 hover:bg-orange-500/10 transition"
                        >
                          <Receipt className="w-3 h-3 text-orange-500" />
                          <span>Voucher</span>
                        </Link>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 italic">No receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Cashier Desk Modal */}
      {isCollectModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="viq-card bg-[var(--bg-primary)] max-w-lg w-full p-6 sm:p-8 space-y-6 my-auto shadow-2xl border border-[var(--border-color)] relative">
            
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <span>Tuition Cashier Desk</span>
                </h3>
                <p className="text-xs viq-text-secondary mt-1">
                  Reconcile installment for <strong>{selectedStudent.studentName}</strong> ({selectedStudent.enrollmentNo}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCollectModalOpen(false);
                  setSelectedStudent(null);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 viq-text-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="viq-text-muted text-[10px] font-mono block uppercase">Total Program Fee</span>
                <span className="font-bold font-mono text-slate-200">₹{selectedStudent.totalFee.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="viq-text-muted text-[10px] font-mono block uppercase">Pending Balance</span>
                <span className="font-bold font-mono text-amber-500">₹{selectedStudent.balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Installment Amount to Collect (INR) *
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  max={selectedStudent.balanceDue > 0 ? selectedStudent.balanceDue : 100000}
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(Number(e.target.value))}
                  className="viq-input w-full px-4 py-2.5 font-mono text-base font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'NET_BANKING'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                        paymentMode === mode
                          ? 'bg-orange-500 text-black border-orange-500 shadow-md'
                          : 'bg-[var(--bg-secondary)] text-slate-400 border-[var(--border-color)] hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Transaction / UTR Reference Note
                </label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="e.g. UPI Ref: 309482098234 / Cash Desk"
                  className="viq-input w-full px-4 py-2.5"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCollectModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reconciling...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Collect & Generate Voucher</span>
                    </>
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