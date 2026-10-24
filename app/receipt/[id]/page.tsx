'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  FileText,
  BadgeCheck,
  Building2,
  Calendar,
  CreditCard,
  Hash
} from 'lucide-react';

interface StudentInfo {
  fullName: string;
  studentCode: string;
  phone: string;
  user?: { email: string };
  course?: { 
    title: string; 
    price?: number; 
    totalFee?: number; 
    durationWeeks?: number; 
    duration?: string; 
  };
  center?: { 
    name: string; 
    centerCode: string; 
    address?: string; 
    phone?: string; 
  };
}

interface FeePlanInfo {
  type: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  student: StudentInfo;
}

interface ReceiptData {
  id: string;
  receiptNo: string;
  amount: number;
  mode: string;
  paymentDate: string;
  feePlan: FeePlanInfo;
}

function ReceiptVoucherContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Robust slug extraction: picks the final path segment regardless of param naming conventions
  const voucherId = pathname?.split('/').filter(Boolean).pop();

  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!voucherId || voucherId.toLowerCase() === 'receipt') {
      setError('Receipt voucher transaction ID is required.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchReceiptData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/receipt/${encodeURIComponent(voucherId ?? '')}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        const result = await response.json();

        if (!isMounted) return;

        if (response.ok && result.success) {
          // Normalize responses whether the server returns { payment } or { receipt }
          if (result.payment) {
            setData(result.payment);
          } else if (result.receipt) {
            const r = result.receipt;
            setData({
              id: r.id,
              receiptNo: r.receiptNumber || r.receiptNo || r.id,
              amount: Number(r.amount) || 0,
              mode: r.paymentMethod || r.mode || 'ONLINE',
              paymentDate: r.paymentDate || new Date().toISOString(),
              feePlan: {
                type: r.ledger?.billingModel || r.feePlan?.type || 'STANDARD_EMI',
                totalAmount: Number(r.ledger?.totalCourseFee ?? r.course?.totalFee ?? r.amount) || 0,
                paidAmount: Number(r.ledger?.totalPaid ?? r.amount) || 0,
                balance: Number(r.ledger?.remainingBalance ?? 0),
                status: r.ledger?.status || 'PAID',
                student: {
                  fullName: r.student?.fullName || 'Enrolled Candidate',
                  studentCode: r.student?.studentCode || 'N/A',
                  phone: r.student?.phone || 'N/A',
                  user: r.student?.user,
                  course: {
                    title: r.course?.title || 'Advanced Technical Certification',
                    duration: r.course?.duration || (r.course?.durationWeeks ? `${r.course.durationWeeks} Weeks` : 'Coursework'),
                  },
                  center: {
                    name: r.center?.name || 'Authorized Training Directorate',
                    centerCode: r.center?.centerCode || 'HQ-MAIN',
                    address: r.center?.address || 'Primary Training Campus',
                    phone: r.center?.phone || 'N/A',
                  },
                },
              },
            });
          } else {
            setError('The receipt response format returned by the server is unrecognized.');
          }
        } else {
          setError(result.error || 'The requested fee payment voucher could not be located in the ledger.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Network error while retrieving transaction ledger.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchReceiptData();

    return () => {
      isMounted = false;
    };
  }, [voucherId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="w-9 h-9 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
            Decrypting & Compiling Digital Voucher...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-5 shadow-2xl text-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Receipt Voucher Unavailable</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {error || 'No registered transaction ledger entry matches this voucher identifier.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Candidate Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student } = data.feePlan;

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 font-sans text-slate-900 selection:bg-orange-500 selection:text-white print:bg-white print:p-0 print:m-0">
      
      {/* Interactive Control Header (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Candidate Hub</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/25 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Voucher</span>
        </button>
      </div>

      {/* Main Printable Voucher Canvas */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 sm:p-12 space-y-8 text-slate-900 print:shadow-none print:border-none print:rounded-none print:p-6 print:max-w-full">
        
        {/* Top Directorate Identity Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black text-base flex items-center justify-center shadow-md">
                VIQ
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight text-slate-900 uppercase">
                  VIQ TECHNOLOGIES
                </h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                  Learning Systems & Certification Directorate
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{student.center?.name || 'Regional Training Center Directorate'}</span>
              </p>
              <p className="pl-5 text-slate-500">{student.center?.address || 'Authorized Study Campus'}</p>
              <p className="pl-5 font-mono text-[11px] text-slate-500">
                Center Code: <span className="font-bold text-slate-700">{student.center?.centerCode || 'HQ-MAIN'}</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 self-stretch sm:self-auto bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-none border-slate-200/80">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL CLEARANCE DESK</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Voucher Serial</span>
              <p className="text-base font-black font-mono text-slate-900 tracking-tight">
                {data.receiptNo}
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Issued: {data.paymentDate ? new Date(data.paymentDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Candidate & Course Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
              Billed Candidate
            </span>
            <p className="text-sm font-bold text-slate-900">{student.fullName}</p>
            <p className="font-mono text-orange-600 font-bold text-[11px] flex items-center gap-1">
              <Hash className="w-3 h-3 text-orange-400" />
              <span>{student.studentCode}</span>
            </p>
            {student.user?.email && <p className="text-slate-500 font-mono text-[11px]">{student.user.email}</p>}
            <p className="text-slate-500 font-mono text-[11px]">{student.phone}</p>
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
              Enrolled Technical Program
            </span>
            <p className="text-sm font-bold text-slate-900">{student.course?.title || 'Certification Program'}</p>
            <p className="text-slate-500">
              Duration: <span className="font-semibold text-slate-700">{student.course?.duration || (student.course?.durationWeeks ? `${student.course.durationWeeks} Weeks` : 'Coursework')}</span>
            </p>
            <p className="text-slate-500">
              Fee Plan Model: <span className="font-mono font-bold text-slate-800 uppercase">{data.feePlan.type}</span>
            </p>
          </div>
        </div>

        {/* Transaction Line Item Table */}
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Transaction Description</th>
                  <th className="py-3 px-4 font-bold">Instrument Mode</th>
                  <th className="py-3 px-4 text-right font-bold">Amount Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900 text-xs">Tuition & Lab Bench Clearance Installment</p>
                    <p className="text-[11px] text-slate-500">Curriculum instruction, AWS cloud credits, repository code evaluations</p>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-700 uppercase">
                    {data.mode}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-black text-sm text-slate-900">
                    ₹{data.amount.toLocaleString('en-IN')}
                  </td >
                </tr>
              </tbody>
            </table>
          </div>

          {/* Account Ledger Balance Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-slate-500">
                <span>Total Program Fee:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{data.feePlan.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cumulative Cleared:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{data.feePlan.paidAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Remaining Account Balance:</span>
                <span className="font-mono font-black text-orange-600">
                  ₹{data.feePlan.balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Verification Token Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-[11px] text-slate-500">
          <div className="space-y-1.5 max-w-sm">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase text-[10px] font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tamper-Resistant Digital Ledger Voucher</span>
            </div>
            <p className="leading-relaxed text-[10px]">
              Electronically validated against the VIQ PostgreSQL core ledger. Requires no manual physical authorized signature.
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-[10px] space-y-0.5">
            <span className="block font-bold text-slate-700 uppercase">Cashier Terminal Authority</span>
            <span className="block text-slate-400">VIQ Central Clearance Desk</span>
            <span className="block text-emerald-600 font-bold">STATUS: VERIFIED & CLEARED</span>
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