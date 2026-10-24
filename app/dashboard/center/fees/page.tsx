'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Search, 
  IndianRupee, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Loader2, 
  Plus, 
  ExternalLink 
} from 'lucide-react';

interface FeeRowItem {
  id: string; // feePlan id
  type: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    phone: string;
    course?: { title: string };
  };
  payments: {
    id: string;
    receiptNo: string;
    amount: number;
    mode: string;
    paymentDate: string;
  }[];
}

interface StudentFeeRecord {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  course?: { title: string };
  feePlan?: {
    id: string;
    type: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    payments?: FeeRowItem['payments'];
  } | null;
}

type StudentWithFeePlan = StudentFeeRecord & {
  feePlan: NonNullable<StudentFeeRecord['feePlan']>;
};

export default function CenterFeesCashierPage() {
  const [feePlans, setFeePlans] = useState<FeeRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Collection Modal State
  const [activePlan, setActivePlan] = useState<FeeRowItem | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  const loadFeeLedger = async () => {
    try {
      const res = await fetch('/api/center/students');
      const data = await res.json();
      if (data.success && data.students) {
        // Extract fee plans with student context
        const students = data.students as StudentFeeRecord[];
        const rows: FeeRowItem[] = students
          .filter((s): s is StudentWithFeePlan => s.feePlan != null)
          .map((s) => ({
            id: s.feePlan.id,
            type: s.feePlan.type,
            totalAmount: s.feePlan.totalAmount,
            paidAmount: s.feePlan.paidAmount,
            balance: s.feePlan.balance,
            status: s.feePlan.status,
            student: {
              id: s.id,
              studentCode: s.studentCode,
              fullName: s.fullName,
              phone: s.phone,
              course: s.course,
            },
            payments: s.feePlan.payments || [],
          }));
        setFeePlans(rows);
      }
    } catch (err) {
      console.error('Failed to load center fee ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeLedger();
  }, []);

  const openCollectionModal = (plan: FeeRowItem) => {
    setActivePlan(plan);
    setCollectAmount(plan.balance);
    setPaymentMode('UPI');
    setRemarks('');
    setErrorMsg('');
    setSuccessReceipt(null);
  };

  const closeCollectionModal = () => {
    setActivePlan(null);
    setCollectAmount(0);
    setErrorMsg('');
    setSuccessReceipt(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;

    if (collectAmount <= 0 || collectAmount > activePlan.balance) {
      setErrorMsg(`Amount must be between ₹1 and ₹${activePlan.balance.toLocaleString('en-IN')}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/fee/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feePlanId: activePlan.id,
          amount: Number(collectAmount),
          mode: paymentMode,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment transaction rejected');

      setSuccessReceipt(data.receiptNo);
      await loadFeeLedger();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to collect payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlans = feePlans.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.student.fullName.toLowerCase().includes(q) ||
      p.student.studentCode.toLowerCase().includes(q) ||
      p.student.course?.title.toLowerCase().includes(q)
    );
  });

  const totalCollectedBranch = feePlans.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalReceivablesBranch = feePlans.reduce((acc, p) => acc + p.balance, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Branch Cashier & Tuition Collection Desk</h1>
          <p className="text-sm text-slate-500">
            Accept installment receipts, issue official vouchers, and verify student ledger balances.
          </p>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inflow Collected</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{totalCollectedBranch.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Verified payments settled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding Dues</span>
            <CreditCard className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2 font-mono">
            ₹{totalReceivablesBranch.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Pending across active students</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Plans Managed</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {feePlans.length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Registered student ledgers</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or roll code..."
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500 self-end sm:self-auto">
          Active Ledgers: <span className="text-slate-900">{filteredPlans.length}</span>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-6 py-4">Student Candidate</th>
                <th className="px-6 py-4">Course Program</th>
                <th className="px-6 py-4">Billing Model</th>
                <th className="px-6 py-4">Paid / Billed</th>
                <th className="px-6 py-4">Remaining Balance</th>
                <th className="px-6 py-4 text-center">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                    Loading cashier ledger accounts...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No student tuition accounts match your query.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((row) => {
                  const isPaid = row.status === 'PAID';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 text-sm block">{row.student.fullName}</span>
                        <span className="font-mono text-orange-600 text-xs block">{row.student.studentCode}</span>
                        <span className="text-slate-400 text-[11px] block">{row.student.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium max-w-xs truncate">
                        {row.student.course?.title || 'Certification Track'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {row.type}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className="font-bold text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-400"> / ₹{row.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {row.balance === 0 ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Cleared
                          </span>
                        ) : (
                          <span className="text-orange-600">₹{row.balance.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPaid ? (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-mono font-bold text-[10px] uppercase">
                            Settled
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCollectionModal(row)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-[11px] transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Collect Fee</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Fee Modal */}
      {activePlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Tuition Collection Terminal</h2>
                <p className="text-xs text-orange-400">Issue verified receipt & adjust student ledger</p>
              </div>
              <button
                type="button"
                onClick={closeCollectionModal}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="px-6 py-2.5 bg-red-50 text-red-700 text-xs font-semibold border-b border-red-100">
                {errorMsg}
              </div>
            )}

            {successReceipt ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Payment Processed Successfully</h3>
                  <p className="text-xs text-slate-500 mt-1">Official Voucher Generated</p>
                  <p className="text-sm font-mono font-black text-orange-600 mt-2 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200 inline-block">
                    {successReceipt}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeCollectionModal}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
                {/* Candidate Overview Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{activePlan.student.fullName}</span>
                    <span className="font-mono font-bold text-orange-600">{activePlan.student.studentCode}</span>
                  </div>
                  <p className="text-slate-500">{activePlan.student.course?.title}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Remaining Due Balance:</span>
                    <span className="font-mono font-black text-orange-600">
                      ₹{activePlan.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activePlan.balance}
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 font-mono text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Payment Gateway / Method *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Hard Cash Deposit</option>
                    <option value="NET_BANKING">Direct Bank NEFT / IMPS</option>
                    <option value="CHEQUE">Bank Cheque / DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Voucher Reference Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Transaction UTR number or cashier notes..."
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeCollectionModal}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{submitting ? 'Generating Receipt...' : 'Confirm & Print Receipt'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}