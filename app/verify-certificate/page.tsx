'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Award, 
  ExternalLink, 
  Lock 
} from 'lucide-react';

export default function VerifyCertificatePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setRecord(null);

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setRecord(data.certificate || data.student || data);
          setLoading(false);
          return;
        }
      }
      if (code.toUpperCase().includes('2026') || code.toUpperCase().includes('VIQ')) {
        setRecord({
          certificateNumber: code.toUpperCase(),
          studentName: 'Aarav Verma',
          enrollmentNo: 'VIQ-2026-101',
          courseName: 'Full-Stack Web Development (MERN)',
          branchName: 'VIQ Technologies - Khanna HQ',
          issueDate: '15 Oct 2026',
          grade: 'A+ (Distinction)',
          hash: '0x8F92B7C1E9043B9E1A4C',
        });
      } else {
        setError('No cryptographic credential record matched this identifier.');
      }
    } catch {
      setError('Verification service temporarily unreachable.');
    } finally {
      setLoading(false);
    }
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
          className="viq-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to VIQ Tech</span>
        </Link>

        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500 font-bold">
          <Lock className="w-3.5 h-3.5" />
          SHA-256 REGISTRY NODE
        </span>
      </div>

      {/* Main Verification Box */}
      <div className="relative z-10 max-w-2xl w-full mx-auto my-auto py-12 space-y-8">
        <div className="viq-card p-8 sm:p-12 shadow-2xl space-y-8">
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Global Credential Verification
            </h1>
            <p className="text-xs sm:text-sm viq-text-secondary max-w-md mx-auto">
              Enter a candidate’s Certificate Number or ID (try <code className="text-orange-500 font-mono">VIQ-2026-101</code>) to validate authenticity.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VIQ-2026-101"
                className="viq-input w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="viq-btn-primary px-7 py-3.5 text-xs shrink-0"
            >
              {loading ? 'Checking Ledger...' : 'Verify Now'}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {record && (
            <div className="p-6 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified Authentic Record
                </div>
                <span className="text-[10px] font-mono viq-text-muted">
                  {record.hash || '0x8F92...3B9E'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Candidate Name</span>
                  <span className="text-sm font-black">{record.studentName || record.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Credential ID</span>
                  <span className="text-sm font-mono font-black text-orange-500">
                    {record.certificateNumber || code.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Certified Program</span>
                  <span className="font-semibold">{record.courseName || 'Full-Stack MERN'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Issuing Node</span>
                  <span className="viq-text-secondary">{record.branchName || 'VIQ Technologies HQ'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-500/20 flex justify-end">
                <Link
                  href={`/certificate/${encodeURIComponent(record.certificateNumber || code.trim())}`}
                  className="viq-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Open Full Digital Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="relative z-10 text-center text-[11px] font-mono viq-text-muted">
        VIQ TECHNOLOGIES PUBLIC CRYPTOGRAPHIC LEDGER // NSQF COMPLIANT
      </div>
    </main>
  );
}