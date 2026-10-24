'use client';

import { useEffect, useState } from 'react';

interface InstallmentItem {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  paidAt?: string | null;
}

interface PaymentItem {
  id: string;
  amount: number;
  mode: string;
  receiptNo: string;
  paymentDate: string;
}

interface FeeDetails {
  id: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  installments: InstallmentItem[];
  payments: PaymentItem[];
}

export default function StudentFeeLedgerPage() {
  const [feeData, setFeeData] = useState<FeeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Development placeholder (Production me authenticated student ki ID aayegi)
  const currentStudentId = 'default-student-id';

  useEffect(() => {
    const fetchFeeLedger = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/fee/details?studentId=${currentStudentId}`);
        const data = await res.json();
        if (data.success) {
          setFeeData(data.feeDetails);
        }
      } catch (err) {
        console.error('Failed to load fee ledger:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeLedger();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Fee Ledger & Payment Receipts</h1>
        <p className="text-sm text-slate-500">
          Review your enrolled billing plan, scheduled EMI deadlines, and verified transaction receipts.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
          Loading billing ledger...
        </div>
      ) : !feeData ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No billing account configured yet. Contact your branch coordinator.
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Course Fee</span>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
                ₹{feeData.totalAmount.toLocaleString('en-IN')}
              </p>
              <span className="text-xs font-medium text-slate-500 mt-1 inline-block">
                Billing Model: <strong>{feeData.type}</strong>
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Settled</span>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
                ₹{feeData.paidAmount.toLocaleString('en-IN')}
              </p>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
                Account Status: {feeData.status}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Balance</span>
              <p className="text-2xl font-black text-orange-600 mt-2 font-mono">
                ₹{feeData.balance.toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-slate-500 mt-1 inline-block">
                {feeData.balance === 0 ? 'All dues cleared' : 'Dues outstanding'}
              </span>
            </div>
          </div>

          {/* Scheduled EMI Breakdown (Agar plan EMI ho) */}
          {feeData.type === 'EMI' && feeData.installments && feeData.installments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">Scheduled EMI Timeline</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feeData.installments.map((inst, idx) => {
                  const isPaid = inst.status === 'PAID';
                  return (
                    <div
                      key={inst.id}
                      className={`p-4 rounded-xl border ${
                        isPaid
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Installment #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ₹{inst.amount.toLocaleString('en-IN')}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Due Date: <strong>{new Date(inst.dueDate).toLocaleDateString()}</strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800">Verified Payment Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Receipt No</th>
                    <th className="px-6 py-3.5">Payment Date</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {feeData.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    feeData.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {p.receiptNo}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {p.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}