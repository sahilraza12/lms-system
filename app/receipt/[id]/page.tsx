'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  Building2,
  BadgeCheck,
  Hash
} from 'lucide-react';

interface NormalizedReceipt {
  id: string;
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  transactionRef?: string;
  student: {
    fullName: string;
    studentCode: string;
    email?: string;
    phone?: string;
    centerName: string;
    centerCode: string;
    address?: string;
  };
  course: {
    title: string;
    totalFee: number;
    duration?: string;
  };
  ledger: {
    feePlanType: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
  };
}

function ReceiptVoucherContent() {
  const [data, setData] = useState<NormalizedReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      try {
        setLoading(true);
        setError(null);

        // 1. Direct browser URL se receipt ID nikaalein (No dependency on Next.js params bugs)
        const currentPath = window.location.pathname; // e.g. "/receipt/REC-2026-0003"
        const segments = currentPath.split('/').filter(Boolean);
        const searchParams = new URLSearchParams(window.location.search);

        // ID nikaalne ke 3 fail-safe tareeqe:
        let rawIdentifier = searchParams.get('id') || searchParams.get('receiptNo') || '';
        if (!rawIdentifier && segments.length > 0) {
          const lastSeg = segments[segments.length - 1];
          if (lastSeg.toLowerCase() !== 'receipt') {
            rawIdentifier = lastSeg;
          }
        }

        const cleanId = decodeURIComponent(rawIdentifier).trim();

        if (!cleanId) {
          setError('Receipt ID missing hai. Kripya student portal se link open karein.');
          setLoading(false);
          return;
        }

        // 2. Student Invoices API se data match karein (Jahan yeh payment pehle se exist karti hai)
        const res = await fetch('/api/student/invoices', {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch invoice ledger from server');
        }

        const invData = await res.json();
        const invoicesList = invData.invoices || [];

        // Exact ya case-insensitive match
        const matched = invoicesList.find(
          (inv: any) =>
            String(inv.id).toLowerCase() === cleanId.toLowerCase() ||
            String(inv.receiptNo).toLowerCase() === cleanId.toLowerCase() ||
            String(inv.paymentId).toLowerCase() === cleanId.toLowerCase()
        );

        if (!matched) {
          setError(`Receipt "${cleanId}" aapke account me nahi mili.`);
          setLoading(false);
          return;
        }

        if (isMounted) {
          const stu = invData.studentDetails || {};
          const crs = invData.courseDetails || {};
          const bill = invData.billingSummary || {};

          setData({
            id: matched.id || cleanId,
            receiptNo: matched.receiptNo || cleanId,
            amount: Number(matched.amount) || 0,
            paymentMode: matched.mode || matched.paymentMode || 'UPI',
            paymentDate: matched.paymentDate || new Date().toISOString(),
            transactionRef: matched.transactionRef || '',
            student: {
              fullName: stu.fullName || 'Enrolled Candidate',
              studentCode: stu.studentCode || 'VIQ-STU',
              email: stu.email || '',
              phone: stu.phone || 'N/A',
              centerName: crs.centerName || 'VIQ Authorized Study Directorate',
              centerCode: crs.centerCode || 'CTR-001',
              address: crs.address || 'Authorized Study Campus',
            },
            course: {
              title: crs.title || 'Technical Engineering Track',
              totalFee: Number(bill.totalAmount) || 0,
              duration: crs.duration || '6 Months',
            },
            ledger: {
              feePlanType: bill.feeType || 'EMI',
              totalAmount: Number(bill.totalAmount) || 0,
              paidAmount: Number(bill.paidAmount) || Number(matched.amount),
              balance: Number(bill.balance) || 0,
              status: Number(bill.balance) === 0 ? 'CLEARED' : 'PARTIAL',
            },
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Error loading receipt.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
            Loading Official Fee Receipt...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0D111A] rounded-2xl p-8 border border-white/10 text-center space-y-5 shadow-2xl text-slate-100">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Receipt Unavailable</h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {error || 'No registered transaction ledger entry matches this voucher identifier.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/student/portal"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold transition shadow-lg shadow-orange-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, course, ledger } = data;

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 font-sans text-slate-900 print:bg-white print:p-0 print:m-0">
      
      {/* Interactive Toolbar */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/student/portal"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D111A] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Student Portal</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold transition shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Voucher Printable Canvas */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-12 space-y-8 text-slate-900 print:shadow-none print:border-none print:rounded-none print:p-4 print:max-w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-black font-black text-base flex items-center justify-center shadow-md">
                VIQ
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight text-slate-950 uppercase">
                  VIQ TECHNOLOGIES
                </h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                  Educational & Technical Directorate
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{student.centerName}</span>
              </p>
              <p className="pl-5 text-slate-500">{student.address}</p>
              <p className="pl-5 font-mono text-[11px] text-slate-500">
                Node ID: <span className="font-bold text-slate-700">{student.centerCode}</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 self-stretch sm:self-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-none border-slate-200">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL TAX RECEIPT</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Voucher Serial</span>
              <p className="text-base font-black font-mono text-slate-900 tracking-tight">
                {data.receiptNo}
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Date: {new Date(data.paymentDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Candidate & Track Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
              Billed Candidate
            </span>
            <p className="text-sm font-bold text-slate-900">{student.fullName}</p>
            <p className="font-mono text-orange-600 font-bold text-[11px] flex items-center gap-1">
              <Hash className="w-3 h-3 text-orange-500" />
              <span>{student.studentCode}</span>
            </p>
            {student.email && <p className="text-slate-500 font-mono text-[11px]">{student.email}</p>}
            {student.phone && <p className="text-slate-500 font-mono text-[11px]">{student.phone}</p>}
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
              Enrolled Technical Track
            </span>
            <p className="text-sm font-bold text-slate-900">{course.title}</p>
            <p className="text-slate-500">
              Duration: <span className="font-semibold text-slate-700">{course.duration}</span>
            </p>
            <p className="text-slate-500">
              Billing Model: <span className="font-mono font-bold text-slate-800 uppercase">{ledger.feePlanType}</span>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Transaction Description</th>
                  <th className="py-3 px-4 font-bold">Payment Instrument</th>
                  <th className="py-3 px-4 text-right font-bold">Amount Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900 text-xs">Fee Installment / Tuition Clearance</p>
                    <p className="text-[11px] text-slate-500">Curriculum instruction, LMS access, and mentor supervision</p>
                    {data.transactionRef && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1">Ref ID: {data.transactionRef}</p>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-700 uppercase">
                    {data.paymentMode}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-black text-sm text-slate-900">
                    ₹{data.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ledger Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-500">
                <span>Total Course Fee:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{ledger.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Paid In This Voucher:</span>
                <span className="font-mono">
                  ₹{data.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Cumulative Cleared:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{ledger.paidAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Outstanding Balance:</span>
                <span className="font-mono font-black text-orange-600">
                  ₹{ledger.balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Certificate Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-[11px] text-slate-500">
          <div className="space-y-1.5 max-w-sm">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase text-[10px] font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronically Authenticated Ledger Voucher</span>
            </div>
            <p className="leading-relaxed text-[10px]">
              Generated by VIQ Technologies LMS infrastructure. Valid without manual signature when verified against centralized ledger records.
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-[10px] space-y-0.5">
            <span className="block font-bold text-slate-700 uppercase">Cashier Terminal Authority</span>
            <span className="block text-slate-400">VIQ Central Clearance Desk</span>
            <span className="block text-emerald-600 font-bold">STATUS: CONFIRMED</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function FeeReceiptVoucherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Initializing Secure Voucher Canvas...
            </p>
          </div>
        </div>
      }
    >
      <ReceiptVoucherContent />
    </Suspense>
  );
}