'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Search, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function CertificateIndexPage() {
  const router = useRouter();
  const [certCode, setCertCode] = useState('');

  const handleOpenCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCode.trim()) return;
    router.push(`/certificate/${encodeURIComponent(certCode.trim().toUpperCase())}`);
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* Framer Cyber Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="text-[11px] font-mono text-orange-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          DIGITAL CREDENTIAL VAULT
        </span>
      </div>

      {/* Center Card */}
      <div className="relative z-10 max-w-xl w-full mx-auto my-auto py-12">
        <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl space-y-8 text-center">
          
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400">
            <Award className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Access Digital Certificate
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
              Enter your unique Credential ID or Enrollment Number to view and download your high-resolution NSQF certificate.
            </p>
          </div>

          <form onSubmit={handleOpenCertificate} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={certCode}
                onChange={(e) => setCertCode(e.target.value)}
                placeholder="e.g. CERT-2026-101"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/80 border border-white/15 focus:border-orange-500 text-xs sm:text-sm text-white font-mono outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold text-xs transition shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Open Certificate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-6 text-[11px] font-mono text-neutral-500">
            <button
              type="button"
              onClick={() => router.push('/certificate/CERT-2026-101')}
              className="text-orange-400 hover:underline"
            >
              Demo Cert #1 (CERT-2026-101) →
            </button>
            <Link href="/verify-certificate" className="text-emerald-400 hover:underline flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />Employer Verify
            </Link>
          </div>

        </div>
      </div>

      <div className="relative z-10 text-center text-[11px] font-mono text-neutral-600">
        CRYPTOGRAPHIC CREDENTIAL ENGINE // EDUNEXUS
      </div>
    </main>
  );
}