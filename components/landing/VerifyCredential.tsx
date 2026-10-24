'use client';

import { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface VerifiedCredential {
  studentName?: string;
  name?: string;
  courseName?: string;
  course?: { name?: string };
  certificateNumber?: string;
  enrollmentNo?: string;
}

export default function VerifyCredential() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedCredential | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(certId.trim())}`);
      const data = await res.json();

      if (res.ok && data && !data.error) {
        setResult(data.certificate as VerifiedCredential);
      } else {
        setError(data.error || 'No valid VIQ cryptographic record found for this ID.');
      }
    } catch {
      setError('Unable to reach verification ledger. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="verify" className="viq-section relative py-28 px-6 sm:px-12 overflow-hidden">
      
      {/* Ambient Emerald Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto z-10">
        <div className="viq-card p-8 sm:p-12 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 viq-pill px-3.5 py-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              [ 04 // PUBLIC VERIFICATION LEDGER ]
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Instant Credential Verification
            </h2>
            <p className="text-xs sm:text-sm viq-text-secondary leading-relaxed">
              Employers and academic bodies can validate any VIQ Technologies certificate or enrollment number in real time.
            </p>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="Enter Certificate No. (e.g., VIQ-2026-001)"
                className="viq-input w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="viq-btn-primary px-7 py-3.5 text-xs shrink-0 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Hash'}
            </button>
          </form>

          {/* Error State */}
          {error && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verified Result State */}
          {result && (
            <div className="max-w-xl mx-auto p-6 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Authentic Credential Verified
                </div>
                <span className="text-[10px] font-mono viq-text-muted">SHA-256 LOCKED</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="viq-text-muted block text-[10px] font-mono uppercase">Candidate Name</span>
                  <span className="font-bold">{result.studentName || result.name || 'Verified Candidate'}</span>
                </div>
                <div>
                  <span className="viq-text-muted block text-[10px] font-mono uppercase">Program / Course</span>
                  <span className="font-bold">{result.courseName || result.course?.name || 'Technical Program'}</span>
                </div>
                <div>
                  <span className="viq-text-muted block text-[10px] font-mono uppercase">Credential Code</span>
                  <span className="text-orange-500 font-mono font-bold">{result.certificateNumber || certId}</span>
                </div>
                <div>
                  <span className="viq-text-muted block text-[10px] font-mono uppercase">Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active & Cleared</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Link to Full Verification Page */}
          <div className="pt-2 text-center">
            <Link
              href="/verify-certificate"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono viq-text-muted hover:text-orange-500 transition-colors"
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Open Full-Screen Verification Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}