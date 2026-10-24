'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Award, 
  Receipt, 
  X, 
  ShieldCheck, 
  Mail, 
  BookOpen, 
  Building2, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface MasterStudent {
  id: string;
  name: string;
  enrollmentNo: string;
  email: string;
  courseName: string;
  branchName: string;
  receiptId?: string | null;
  status: string;
}

interface StudentApiRecord {
  id?: string;
  name?: string;
  fullName?: string;
  enrollmentNo?: string;
  studentCode?: string;
  email?: string;
  user?: { email?: string };
  course?: { name?: string; title?: string };
  courseName?: string;
  center?: { name?: string };
  branchName?: string;
  receiptId?: string | null;
  receipts?: Array<{ id: string }>;
  status?: string;
}

const AVAILABLE_COURSES = [
  'Artificial Intelligence & Machine Learning (AI/ML)',
  'Data Science & Advanced Analytics',
  'Full-Stack Web Development (MERN & Next.js)',
  'Cybersecurity & Ethical Hacking',
  'Cloud Architecture & DevOps (AWS/Azure)',
  'Java Full-Stack Software Engineering',
  'Python Data Engineering & AI Automation',
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<MasterStudent[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([
    'VIQ Technologies - Khanna HQ',
    'VIQ Technologies - Ludhiana',
    'VIQ Technologies - Chandigarh',
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal Step Workflow: 'DETAILS' | 'OTP'
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Candidate Registration Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [courseName, setCourseName] = useState(AVAILABLE_COURSES[0]);
  const [branchName, setBranchName] = useState('VIQ Technologies - Khanna HQ');

  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);

  // Load students telemetry & registered centers from backend
  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      
      const [studentsRes, centersRes] = await Promise.allSettled([
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/admin/centers', { cache: 'no-store' }),
      ]);

      if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
        const data = await studentsRes.value.json().catch(() => null);
        const list = Array.isArray(data) ? data : data?.students || [];
        if (Array.isArray(list)) {
          const mapped = list.map((s: StudentApiRecord, idx: number) => ({
            id: s.id || `st-${idx}`,
            name: s.name || s.fullName || 'Candidate',
            enrollmentNo: s.enrollmentNo || s.studentCode || `VIQ-2026-${100 + idx}`,
            email: s.email || s.user?.email || 'student@viqtech.in',
            courseName: s.course?.name || s.course?.title || s.courseName || 'Full-Stack Web Development (MERN)',
            branchName: s.center?.name || s.branchName || 'VIQ Technologies - Khanna HQ',
            receiptId: s.receiptId || (s.receipts && s.receipts[0]?.id) || null,
            status: s.status || 'ACTIVE',
          }));
          setStudents(mapped);
        }
      }

      if (centersRes.status === 'fulfilled' && centersRes.value.ok) {
        const centersData = await centersRes.value.json().catch(() => null);
        const centerList = centersData?.centers || [];
        if (Array.isArray(centerList) && centerList.length > 0) {
          const names = centerList.map((c: any) => c.name);
          setAvailableBranches(names);
          setBranchName(names[0]);
        }
      }
    } catch (err) {
      console.warn('Candidate telemetry query failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle OTP Resend countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modalStep === 'OTP' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalStep, otpTimer]);

  // Step 1: Request OTP Token for candidate email (Protected against HTML 404 responses)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/students/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
        }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('API route /api/admin/students/send-otp is not created yet or returned HTML.');
      }

      if (!res.ok) {
        throw new Error(json.error || 'Failed to dispatch verification code.');
      }

      setModalStep('OTP');
      setOtpTimer(60);
      setOtpCode('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error transmitting verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Confirm OTP & Provision Candidate Record
  const handleVerifyAndEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please input a valid 6-digit verification code.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    const newEnrollmentNo = `VIQ-2026-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          courseName,
          branchName,
          enrollmentNo: newEnrollmentNo,
          otp: otpCode.trim(),
        }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!res.ok) {
        throw new Error(json.error || 'Failed to enroll candidate.');
      }

      handleCloseModal();
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Admission provisioning failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalStep('DETAILS');
    setErrorMsg('');
    setName('');
    setEmail('');
    setOtpCode('');
  };

  const uniqueBranches = Array.from(new Set(students.map((s) => s.branchName)));
  
  const filtered = students.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(query) ||
      s.enrollmentNo.toLowerCase().includes(query) ||
      s.courseName.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);
    const matchesBranch = branchFilter === 'ALL' || s.branchName === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0 font-sans">
      
      {/* 1. Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Master Candidate Roster</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {loading ? '...' : `${students.length} Candidates`}
            </span>
          </h1>
          <p className="text-xs sm:text-sm viq-text-secondary mt-1">
            Central directory of all enrolled candidates across every VIQ branch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadData(true)}
            className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-secondary)] text-slate-300 transition cursor-pointer"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="viq-btn-primary inline-flex items-center gap-2 px-5 py-3 text-xs self-start sm:self-auto font-bold shadow-lg shadow-orange-600/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Enroll Candidate</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Branch Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, or program..."
            className="viq-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 viq-pill px-3.5 py-2">
          <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
              All Branches ({students.length})
            </option>
            {uniqueBranches.map((b) => (
              <option key={b} value={b} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Candidates Data Container */}
      {loading ? (
        <div className="py-20 text-center viq-card border border-[var(--border-color)] rounded-2xl space-y-3">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-orange-500" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Loading candidate records...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center viq-card border border-dashed border-[var(--border-color)] rounded-2xl space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No Candidates Found</p>
          <p className="text-xs viq-text-muted">
            {search ? 'No records match your filter criteria.' : 'Enroll a new student to initiate admissions tracking.'}
          </p>
        </div>
      ) : (
        <div className="viq-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                  <th className="py-3.5 px-6 font-bold">Candidate & ID</th>
                  <th className="py-3.5 px-6 font-bold">Email</th>
                  <th className="py-3.5 px-6 font-bold">Enrolled Program</th>
                  <th className="py-3.5 px-6 font-bold">Branch Node</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                  <th className="py-3.5 px-6 text-right font-bold">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                    <td className="py-4 px-6 font-bold">
                      {st.name}
                      <span className="block text-[10px] font-mono text-orange-500 mt-0.5">{st.enrollmentNo}</span>
                    </td>
                    <td className="py-4 px-6 viq-text-secondary font-mono font-medium">{st.email}</td>
                    <td className="py-4 px-6 font-semibold">{st.courseName}</td>
                    <td className="py-4 px-6 viq-text-secondary font-medium">{st.branchName}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                        {st.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {/* Fixed: If receipt voucher exists, open it. Otherwise jump to fee collection desk! */}
                      {st.receiptId ? (
                        <Link
                          href={`/receipt/${st.receiptId}`}
                          className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] text-orange-400 border-orange-500/30 hover:bg-orange-500/10 transition"
                          title="View Issued Receipt Voucher"
                        >
                          <Receipt className="w-3 h-3 text-orange-500" />
                          <span>Receipt</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/fees?studentId=${st.id}&name=${encodeURIComponent(st.name)}&enrollmentNo=${st.enrollmentNo}`}
                          className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition"
                          title="No voucher yet — Click to collect fee"
                        >
                          <Receipt className="w-3 h-3 text-amber-500" />
                          <span>Collect Fee</span>
                        </Link>
                      )}

                      <Link
                        href={`/certificate/${st.enrollmentNo}`}
                        className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 transition"
                      >
                        <Award className="w-3 h-3 text-emerald-500" />
                        <span>Cert</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Two-Step Email OTP Candidate Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="viq-card bg-[var(--bg-primary)] max-w-md w-full p-6 sm:p-8 space-y-6 my-auto shadow-2xl border border-[var(--border-color)] relative">
            
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h3 className="text-xl font-black">
                  {modalStep === 'DETAILS' ? 'Enroll New Candidate' : 'Verify Candidate Identity'}
                </h3>
                <p className="text-xs viq-text-secondary mt-1">
                  {modalStep === 'DETAILS'
                    ? 'Assign student to a branch node and verify identity clearance.'
                    : `Input the 6-digit verification code transmitted to ${email}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-white/10 viq-text-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Candidate Details Form */}
            {modalStep === 'DETAILS' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sahil Raza"
                    className="viq-input w-full px-4 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Candidate Official Email (Receives OTP PIN) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. candidate@viqtech.in"
                      className="viq-input w-full pl-9 pr-4 py-2.5 text-xs"
                    />
                  </div>
                </div>

                {/* Technical Program Dropdown Selector */}
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Technical Program *
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="viq-input w-full pl-9 pr-8 py-2.5 text-xs appearance-none cursor-pointer bg-[var(--bg-secondary)]"
                    >
                      {AVAILABLE_COURSES.map((course) => (
                        <option key={course} value={course} className="bg-[#0B0F17] text-white">
                          {course}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Assign Franchise Branch Dropdown Selector */}
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Assign Franchise Branch *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="viq-input w-full pl-9 pr-8 py-2.5 text-xs appearance-none cursor-pointer bg-[var(--bg-secondary)]"
                    >
                      {availableBranches.map((branch) => (
                        <option key={branch} value={branch} className="bg-[#0B0F17] text-white">
                          {branch}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Token...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Email & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Candidate OTP Verification Form */}
            {modalStep === 'OTP' && (
              <form onSubmit={handleVerifyAndEnroll} className="space-y-5 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-200">Enter Candidate Passkey</p>
                  <p className="text-[11px] text-slate-400">
                    A 6-digit numeric PIN has been transmitted directly to <strong className="text-white">{email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1 text-center">
                    6-Digit Clearance Token
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="viq-input w-full py-3.5 text-center font-mono text-2xl tracking-[0.5em] font-black"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setModalStep('DETAILS')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    ← Edit Information
                  </button>

                  {otpTimer > 0 ? (
                    <span className="viq-text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend in {otpTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => void handleRequestOtp(e)}
                      className="text-orange-500 hover:underline font-bold cursor-pointer"
                    >
                      Resend PIN
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || otpCode.length < 6}
                    className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Admission</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}