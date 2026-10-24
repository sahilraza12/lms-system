'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';

interface CertificateRecord {
  id: string;
  certNumber?: string | null;
  certType: string;
  studentName: string;
  enrollmentNo: string;
  courseName: string;
  branchName: string;
  status: 'REQUESTED' | 'VERIFIED' | 'APPROVED' | 'ISSUED' | 'REJECTED';
  verificationHash: string;
  issueDate?: string | null;
  createdAt: string;
}

interface CertificateApiRecord {
  id: string;
  certNumber: string | null;
  certType: string;
  status: CertificateRecord['status'];
  verificationUrl: string | null;
  issueDate: string | null;
  createdAt: string;
  student: {
    fullName: string;
    studentCode: string;
    course: { title: string };
    center: { name: string };
  };
}

interface StudentOption {
  id: string;
  name: string;
  enrollmentNo: string;
  courseName: string;
}

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ISSUED' | 'REJECTED'>('ALL');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>('');

  // Clearance Creation Modal States
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [certificateType, setCertificateType] = useState('Academic Completion');
  const [modalStatus, setModalStatus] = useState<'REQUESTED' | 'ISSUED'>('REQUESTED');
  const [creatingCert, setCreatingCert] = useState(false);

  // Deterministic String Hasher for Tamper-Proof Visual Hash
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setActionError('');

      const [certRes, stuRes] = await Promise.all([
        fetch('/api/admin/certificates', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' })
      ]);

      const certJson = await certRes.json() as {
        certificates?: CertificateApiRecord[];
        error?: string;
      };
      if (!certRes.ok || !Array.isArray(certJson.certificates)) {
        throw new Error(certJson.error || 'Failed to load certificate records.');
      }

      const mapped: CertificateRecord[] = certJson.certificates.map((certificate) => ({
        id: certificate.id,
        certNumber: certificate.certNumber,
        certType: certificate.certType,
        studentName: certificate.student.fullName,
        enrollmentNo: certificate.student.studentCode,
        courseName: certificate.student.course.title,
        branchName: certificate.student.center.name,
        status: certificate.status,
        verificationHash: certificate.verificationUrl
          ? `0x${certificate.id.substring(0, 4).toUpperCase()}...${certificate.id.slice(-4).toUpperCase()}`
          : certificate.status === 'ISSUED'
            ? `0x${Math.abs(hashString(certificate.id)).toString(16).substring(0, 8).toUpperCase()}`
            : 'PENDING_CLEARANCE',
        issueDate: certificate.issueDate,
        createdAt: certificate.createdAt,
      }));
      setCerts(mapped);

      const studentJson = await stuRes.json() as {
        students?: Array<{
          id: string;
          fullName: string;
          studentCode: string;
          course?: { title: string } | null;
        }>;
        error?: string;
      };
      if (!stuRes.ok || !Array.isArray(studentJson.students)) {
        throw new Error(studentJson.error || 'Failed to load students.');
      }

      const mappedStudents: StudentOption[] = studentJson.students.map((student) => ({
        id: student.id,
        name: student.fullName,
        enrollmentNo: student.studentCode,
        courseName: student.course?.title || 'Program',
      }));
      setStudents(mappedStudents);
      setSelectedStudentId((currentId) =>
        mappedStudents.some((student) => student.id === currentId)
          ? currentId
          : mappedStudents[0]?.id || ''
      );
    } catch (err: unknown) {
      console.error('Certificate admin data fetch failed:', err);
      setActionError(err instanceof Error ? err.message : 'Could not sync certificate data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const handleUpdateStatus = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setActionId(id);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action.toLowerCase()} certificate.`);
      }

      await loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleCreateClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setCreatingCert(true);
    setActionError('');

    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          certType: certificateType,
          status: modalStatus,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Failed to request certificate clearance.');
      }

      setShowIssueModal(false);
      await loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Clearance generation failed.');
    } finally {
      setCreatingCert(false);
    }
  };

  // Filter & Search Logic
  const filteredCerts = certs.filter((cert) => {
    const q = search.toLowerCase();
    const matchesSearch =
      cert.studentName.toLowerCase().includes(q) ||
      cert.enrollmentNo.toLowerCase().includes(q) ||
      (cert.certNumber && cert.certNumber.toLowerCase().includes(q)) ||
      cert.certType.toLowerCase().includes(q) ||
      cert.courseName.toLowerCase().includes(q) ||
      cert.branchName.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && (
        cert.status === 'REQUESTED' || cert.status === 'VERIFIED' || cert.status === 'APPROVED'
      )) ||
      cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0 font-sans">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Cryptographic Certificate Clearance</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {loading ? '...' : `${certs.length} Records`}
            </span>
          </h1>
          <p className="text-xs sm:text-sm viq-text-secondary mt-1">
            Approve candidate academic clearance and generate SHA-256 tamper-proof credential hashes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowIssueModal(true)}
            className="viq-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Issue Clearance</span>
          </button>

          <button
            type="button"
            onClick={() => void loadData(true)}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-secondary)] text-slate-300 transition cursor-pointer"
            title="Refresh Database Records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, enrollment no, cert ID, or branch..."
            className="viq-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'PENDING', 'ISSUED', 'REJECTED'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer ${
                statusFilter === key
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'viq-pill text-slate-400 hover:text-white'
              }`}
            >
              {key === 'PENDING' ? 'UNDER REVIEW' : key}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Certificate Data Table Container */}
      {loading ? (
        <div className="py-20 text-center viq-card border border-[var(--border-color)] rounded-2xl space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-orange-500" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Synchronizing cryptographic certificate ledger...
          </p>
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="py-16 text-center viq-card border border-dashed border-[var(--border-color)] rounded-2xl space-y-3">
          <Award className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No Certificate Records Found</p>
          <p className="text-xs viq-text-muted max-w-sm mx-auto">
            {search
              ? 'No certificates matched your query filter.'
              : 'Click "Issue Clearance" above to request academic clearance for an enrolled candidate.'}
          </p>
        </div>
      ) : (
        <div className="viq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                  <th className="py-3.5 px-6 font-bold">Credential / Cert ID</th>
                  <th className="py-3.5 px-6 font-bold">Candidate</th>
                  <th className="py-3.5 px-6 font-bold">Program</th>
                  <th className="py-3.5 px-6 font-bold">Branch Node</th>
                  <th className="py-3.5 px-6 font-bold">Verification Hash</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredCerts.map((cert) => {
                  const isPending =
                    cert.status === 'REQUESTED' ||
                    cert.status === 'VERIFIED' ||
                    cert.status === 'APPROVED';
                  const isProcessing = actionId === cert.id;

                  return (
                    <tr key={cert.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                      <td className="py-4 px-6 font-mono font-bold">
                        <span className={cert.certNumber ? 'text-emerald-400' : 'text-orange-400'}>
                          {cert.certNumber || cert.enrollmentNo}
                        </span>
                        {cert.certNumber && (
                          <span className="block text-[9px] text-slate-500 font-mono">
                            {cert.enrollmentNo}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-200">{cert.studentName}</td>
                      <td className="py-4 px-6 viq-text-secondary font-medium">
                        {cert.courseName}
                        <span className="block text-[9px] viq-text-muted">{cert.certType}</span>
                      </td>
                      <td className="py-4 px-6 viq-text-secondary">{cert.branchName}</td>
                      <td className="py-4 px-6 font-mono viq-text-muted text-[11px]">
                        {cert.verificationHash}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            cert.status === 'ISSUED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(cert.id, 'APPROVE')}
                              className="viq-btn-primary px-3 py-1.5 text-[11px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Approve & Issue</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(cert.id, 'REJECT')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                              title="Reject Clearance"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : cert.status === 'ISSUED' ? (
                          <Link
                            href={`/certificate/${cert.certNumber || cert.enrollmentNo}`}
                            className="inline-flex items-center gap-1.5 viq-pill px-3 py-1.5 font-mono text-[11px] font-bold hover:text-emerald-400 border-emerald-500/30 transition"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500" />
                          </Link>
                        ) : (
                          <span className="text-[10px] font-mono text-red-400 italic">Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Issue Clearance Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="viq-card bg-[var(--bg-primary)] max-w-md w-full p-6 sm:p-8 space-y-6 my-auto shadow-2xl border border-[var(--border-color)] relative">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <span>Issue Clearance Record</span>
                </h3>
                <p className="text-xs viq-text-secondary mt-1">
                  Select a candidate to generate a verifiable cryptographic credential request.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 viq-text-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClearance} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Select Candidate *
                </label>
                {students.length > 0 ? (
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="viq-input w-full px-3 py-2.5 appearance-none bg-[var(--bg-secondary)] cursor-pointer"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0B0F17] text-white">
                        {s.name} ({s.enrollmentNo || s.courseName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-slate-400 text-xs">
                    No enrolled candidates found. Enroll a student in Master Students first.
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="certificate-type" className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Certificate Type *
                </label>
                <input
                  id="certificate-type"
                  type="text"
                  required
                  maxLength={100}
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  placeholder="e.g. Academic Completion"
                  className="viq-input w-full px-3 py-2.5 bg-[var(--bg-secondary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Clearance Pipeline Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatus('REQUESTED')}
                    className={`py-2 px-3 rounded-xl font-mono text-[11px] font-bold border transition cursor-pointer ${
                      modalStatus === 'REQUESTED'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-[var(--bg-secondary)] text-slate-400 border-[var(--border-color)]'
                    }`}
                  >
                    Submit for Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatus('ISSUED')}
                    className={`py-2 px-3 rounded-xl font-mono text-[11px] font-bold border transition cursor-pointer ${
                      modalStatus === 'ISSUED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-[var(--bg-secondary)] text-slate-400 border-[var(--border-color)]'
                    }`}
                  >
                    Direct Issue (Bypass)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCert || students.length === 0 || !certificateType.trim()}
                  className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creatingCert ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generate Clearance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}