'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CertificateViewPage() {
  const params = useParams();
  const certId = decodeURIComponent((params?.id as string) || 'VIQ-2026-101');

  return (
    <div className="viq-page min-h-screen p-6 sm:p-12 flex flex-col items-center justify-between selection:bg-orange-500 selection:text-white">
      
      <div className="w-full max-w-4xl flex items-center justify-between print:hidden mb-8">
        <Link
          href="/verify-certificate"
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
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div className="relative w-full max-w-4xl viq-card border-2 border-orange-500/40 p-8 sm:p-14 shadow-2xl overflow-hidden my-auto">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-10 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="viq-btn-primary w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg">
              VIQ
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-orange-500 font-bold">
              VIQ Technologies Autonomous Training Cloud
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
              Certificate of Mastery
            </h1>
          </div>

          <div className="space-y-3 py-6 border-y border-[var(--border-color)] max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest viq-text-muted">
              This credential is proudly conferred upon
            </p>
            <h2 className="text-3xl sm:text-4xl font-black viq-gradient-text">
              Sahil Raza
            </h2>
            <p className="text-xs sm:text-sm viq-text-secondary max-w-xl mx-auto leading-relaxed pt-2">
              for successfully completing all practical assessments, architectural deployments, and competency benchmarks in
            </p>
            <p className="text-lg sm:text-2xl font-black pt-1">
              Full-Stack Web Development & Cloud Systems
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-4 border-t border-[var(--border-color)] text-xs font-mono">
            <div>
              <span className="viq-text-muted block text-[10px] uppercase font-bold">Credential ID</span>
              <span className="text-orange-500 font-bold">{certId}</span>
            </div>
            <div>
              <span className="viq-text-muted block text-[10px] uppercase font-bold">Verification Status</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 VERIFIED
              </span>
            </div>
            <div className="sm:text-right">
              <span className="viq-text-muted block text-[10px] uppercase font-bold">Issuing Authority</span>
              <span className="font-bold">VIQ Academic Board</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-mono viq-text-muted mt-8 print:hidden">
        TAMPER-PROOF DIGITAL CREDENTIAL // VERIFY AT VIQTECH.IN
      </div>
    </div>
  );
}