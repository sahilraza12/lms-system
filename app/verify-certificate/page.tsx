'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Award, 
  ExternalLink, 
  Lock,
  Loader2,
  Calendar,
  Building,
  GraduationCap
} from 'lucide-react';

interface VerifiedCertificate {
  certificateNumber: string;
  studentName: string;
  name?: string;
  courseName: string;
  branchName: string;
  issueDate: string;
  status?: string;
}

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const initialCertNo = searchParams.get('certNo') || searchParams.get('code') || '';

  const [code, setCode] = useState(initialCertNo);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<VerifiedCertificate | null>(null);
  const [error, setError] = useState('');

  const executeVerification = useCallback(async (searchCode: string) => {
    const trimmed = searchCode.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setRecord(null);

    try {
      const res = await fetch(`/api/verify?certNo=${encodeURIComponent(trimmed)}`);
      const data: any = await res.json().catch(() => null);

      if (res.ok && data && (data.valid === true || data.success === true)) {
        const certData = data.certificate || data.cert || data.record;
        if (certData) {
          setRecord({
            certificateNumber: certData.certificateNumber || certData.certNumber || trimmed,
            studentName: certData.studentName || certData.name || certData.student?.fullName || 'Verified Candidate',
            courseName: certData.courseName || certData.course?.title || 'Certified Specialization',
            branchName: certData.branchName || certData.center?.name || 'Authorized Regional Node',
            issueDate: certData.issueDate || certData.createdAt || new Date().toISOString(),
            status: certData.status || 'ISSUED',
          });
        } else {
          setError('Verification ledger record is incomplete.');
        }
      } else {
        setError(data?.error || data?.message || 'No issued certificate matches this registry ID.');
      }
    } catch {
      setError('Verification node temporarily unreachable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search if URL contains parameter
  useEffect(() => {
    if (initialCertNo) {
      setCode(initialCertNo);
      void executeVerification(initialCertNo);
    }
  }, [initialCertNo, executeVerification]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void executeVerification(code);
  };

  return (
    <main className="viq-page relative min-h-screen flex flex-col justify-between p-6 sm:p-12 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 viq-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="viq-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition hover:border-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500 font-bold">
          <Lock className="w-3.5 h-3.5" />
          SHA-256 LEDGER NODE
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="relative z-10 max-w-2xl w-full mx-auto my-auto py-10 space-y-8">
        <div className="viq-card p-8 sm:p-12 shadow-2xl space-y-8 bg-[var(--bg-glass-subtle)]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Global Credential Verification
            </h1>
            <p className="text-xs sm:text-sm viq-text-secondary max-w-md mx-auto">
              Authenticate digital course diplomas and academic certifications issued across all regional branches.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter Certificate No. (e.g. CERT-2026-001)"
                className="viq-input w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm font-mono tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="viq-btn-primary px-7 py-3.5 text-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Verify Now</span>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {record && (
            <div className="p-6 sm:p-7 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/30 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Officially Verified & Authentic</span>
                </div>
                <span className="text-[10px] font-mono viq-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {record.issueDate
                    ? new Date(record.issueDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Issued'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase viq-text-muted font-bold block">
                    Candidate Full Name
                  </span>
                  <span className="text-sm font-black text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-orange-500" />
                    {record.studentName || record.name}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase viq-text-muted font-bold block">
                    Registry Serial ID
                  </span>
                  <span className="text-sm font-mono font-black text-orange-500">
                    {record.certificateNumber}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase viq-text-muted font-bold block">
                    Certified Program
                  </span>
                  <span className="font-semibold text-slate-200">{record.courseName}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase viq-text-muted font-bold block">
                    Issuing Training Branch
                  </span>
                  <span className="viq-text-secondary flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {record.branchName}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-500/20 flex justify-end">
                <Link
                  href={`/certificate/${encodeURIComponent(record.certificateNumber)}`}
                  className="viq-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md shadow-orange-500/10 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Open Full Digital Certificate</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 text-center text-[11px] font-mono viq-text-muted">
        VIQ TECHNOLOGIES PUBLIC CRYPTOGRAPHIC LEDGER // SECURE VERIFICATION
      </div>
    </main>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}