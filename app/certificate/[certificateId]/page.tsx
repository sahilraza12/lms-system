'use client';

import { useEffect, useState, use } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Printer, 
  ArrowLeft, 
  QrCode, 
  Share2,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface CertificatePayload {
  certificateId: string;
  certType: string;
  studentName: string;
  studentCode: string;
  courseTitle: string;
  courseCode: string;
  duration: string;
  level: string;
  centerName: string;
  mentorName: string;
  issueDate: string;
  verifiedStatus: string;
  attendancePercentage: number;
  feeCleared: boolean;
}

function CertificateContent({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const resolvedParams = use(params);
  const [cert, setCert] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificate/${resolvedParams.certificateId}`);
        const data = await res.json();
        if (data.success && data.certificate) {
          setCert(data.certificate);
        } else {
          setError(data.error || 'Credential not found in public registry');
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Verification pipeline unreachable',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCredential();
  }, [resolvedParams.certificateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Cryptographically Verifying Registry Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black tracking-tight">Credential Verification Failed</h1>
          <p className="text-xs text-slate-400">{error || 'This digital credential could not be authenticated against the central repository.'}</p>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Candidate Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 font-sans text-slate-100 selection:bg-orange-500 selection:text-white print:bg-white print:py-0 print:px-0 print:text-slate-900">
      
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Student Terminal</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{copied ? 'Link Copied!' : 'Share Public Link'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-lg shadow-orange-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Verified Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Digital Certificate Paper */}
      <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-3xl border-2 border-orange-500/30 p-8 sm:p-14 relative overflow-hidden shadow-2xl print:border print:border-slate-300 print:bg-white print:shadow-none print:p-8 print:rounded-none">
        
        {/* Subtle Decorative Background Seal */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl pointer-events-none print:hidden" />
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none print:hidden" />

        {/* Inner Frame */}
        <div className="border border-slate-800 print:border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 relative">
          
          {/* Header Seal & Registry Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 print:border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                VIQ
              </div>
              <div>
                <span className="font-black text-base sm:text-lg tracking-tight block text-white print:text-slate-900">
                  VIQ LEARNING CLOUD
                </span>
                <span className="text-[10px] font-mono text-cyan-400 print:text-cyan-700 uppercase tracking-widest block font-bold">
                  DIRECTORATE OF TECHNICAL EDUCATION
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 print:bg-emerald-50 print:text-emerald-700 border border-emerald-500/20 inline-flex items-center gap-1.5 uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{cert.verifiedStatus}</span>
              </span>
              <p className="text-[11px] font-mono text-slate-400 print:text-slate-600">
                TOKEN: <span className="font-bold text-slate-200 print:text-slate-800">{cert.certificateId}</span>
              </p>
            </div>
          </div>

          {/* Certificate Main Title & Text */}
          <div className="text-center space-y-5 py-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 print:text-orange-600 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              {cert.certType}
            </div>

            <h2 className="text-sm uppercase tracking-widest text-slate-400 print:text-slate-500 font-medium">
              This Credential Confirms That
            </h2>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white print:text-slate-900 font-serif">
              {cert.studentName}
            </h1>

            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 print:text-slate-600 leading-relaxed">
              has successfully fulfilled all requirements, laboratory coursework, code reviews, and comprehensive examinations prescribed for the professional curriculum:
            </p>

            <div className="py-2">
              <span className="text-xl sm:text-2xl font-black text-orange-400 print:text-orange-600 tracking-tight block">
                {cert.courseTitle}
              </span>
              <span className="text-xs font-mono text-slate-400 print:text-slate-500 mt-1 block">
                PROGRAM CODE: {cert.courseCode} • {cert.duration} • {cert.level}
              </span>
            </div>
          </div>

          {/* Verification Metrics & Registry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 print:border-slate-200 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Student Identification
              </span>
              <p className="font-bold font-mono text-white print:text-slate-900 text-sm">
                {cert.studentCode}
              </p>
              <p className="text-[11px] text-slate-400 print:text-slate-600 truncate">
                {cert.centerName}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Assigned Faculty Mentor
              </span>
              <p className="font-bold text-white print:text-slate-900 text-sm truncate">
                {cert.mentorName}
              </p>
              <p className="text-[11px] text-emerald-400 print:text-emerald-700 font-mono">
                {cert.attendancePercentage}% Attendance Verified
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Date of Accreditation
              </span>
              <p className="font-bold font-mono text-white print:text-slate-900 text-sm">
                {new Date(cert.issueDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Central Registry Ledger
              </p>
            </div>
          </div>

          {/* Footer Sign-off & Public QR Clearance */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-slate-400 print:text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-slate-700 print:border-slate-300">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-300 print:text-slate-800 block">
                  On-Chain Cryptographic Registry
                </span>
                <p className="text-[11px] max-w-xs leading-relaxed">
                  Scan to authenticate this credential directly against the VIQ institutional database.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 self-stretch sm:self-auto border-t sm:border-none border-slate-800 pt-3 sm:pt-0">
              <div className="font-serif italic text-lg sm:text-xl text-orange-400 print:text-orange-700">
                Executive Dean Directorate
              </div>
              <div className="w-36 h-0.5 bg-slate-700 print:bg-slate-400 ml-auto my-1" />
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                VIQ Head of Academic Operations
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DigitalCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            Loading certificate…
          </p>
        </div>
      }
    >
      <CertificateContent params={params} />
    </Suspense>
  );
}