'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FeeReceiptPage() {
  const params = useParams();
  const receiptId = decodeURIComponent((params?.id as string) || 'RCP-2026-101');

  return (
    <div className="viq-page min-h-screen p-6 sm:p-12 flex flex-col items-center justify-between selection:bg-orange-500 selection:text-white">
      
      <div className="w-full max-w-2xl flex items-center justify-between print:hidden mb-8">
        <Link
          href="/"
          className="viq-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="viq-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs shadow-lg"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      <div className="w-full max-w-2xl viq-card p-8 sm:p-10 shadow-2xl space-y-8 my-auto">
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-6">
          <div className="flex items-center gap-3">
            <div className="viq-btn-primary w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">
              VIQ
            </div>
            <div>
              <h1 className="text-lg font-black">VIQ Technologies Institutional Ledger</h1>
              <p className="text-[11px] font-mono viq-text-muted font-bold">OFFICIAL FEE & INSTALLMENT RECEIPT</p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="viq-text-muted block text-[10px] uppercase font-bold">RECEIPT NO.</span>
            <span className="text-orange-500 font-bold">{receiptId.toUpperCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Candidate Name</span>
            <span className="text-sm font-black">Sahil Raza</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Payment Status</span>
            <span className="text-emerald-500 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED & POSTED
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Enrolled Program</span>
            <span className="font-semibold">Full-Stack Web Development (MERN)</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Payment Mode</span>
            <span className="font-mono">Digital Ledger / UPI Instant</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between viq-text-secondary">
            <span>Program Tuition Installment</span>
            <span className="font-bold">₹25,000.00</span>
          </div>
          <div className="flex justify-between viq-text-secondary">
            <span>Lab & Certification Fee</span>
            <span className="text-emerald-500 font-bold">INCLUDED</span>
          </div>
          <div className="border-t border-[var(--border-color)] pt-3 flex justify-between text-sm font-black">
            <span>Total Amount Paid</span>
            <span className="text-orange-500">₹25,000.00</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono viq-text-muted font-bold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            COMPUTER GENERATED CRYPTOGRAPHIC RECEIPT
          </span>
          <span>2026 VIQ TECHNOLOGIES</span>
        </div>
      </div>

      <div className="text-[11px] font-mono viq-text-muted mt-8 print:hidden">
        ZERO-LATENCY FEE LEDGER // VIQ TECH ERP
      </div>
    </div>
  );
}