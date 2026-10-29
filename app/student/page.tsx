'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Receipt, 
  Megaphone, 
  Sparkles,
  GitBranch,
  Globe,
  X,
  CheckCircle2,
  Send,
  Loader2,
  Clock,
  Award,
  UploadCloud,
  File as FileIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';
import BrandLogo from '@/components/brand/BrandLogo';

interface SubmissionData {
  id: string;
  submissionUrl?: string;
  fileUrls?: string[];
  remarks: string | null;
  submittedAt?: string;
  status: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  submissionId?: string;
  submissionUrl?: string;
  fileUrls?: string[];
  remarks?: string;
}

interface NoteItem {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
}

interface PaymentRecord {
  id: string;
  receiptNo: string;
  amount: number;
  mode: string;
  paymentDate: string;
  receiptUrl?: string;
}

interface StudentProfile {
  id: string;
  name: string;
  enrollmentNo: string;
  email: string;
  courseName: string;
  batch: string;
  progress: number;
  feePlan?: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    payments: PaymentRecord[];
  } | null;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
}

export default function StudentPortalPage() {
  const router = useRouter();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeSubmittingTask, setActiveSubmittingTask] = useState<TaskItem | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Session verification & live portal data retrieval
  const loadPortalData = useCallback(async () => {
    try {
      setLoading(true);
      const [resProfile, resInvoices, resAnnounce] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/student/invoices'),
        fetch('/api/student/announcements'),
      ]);

      // Redirect if session is unauthenticated or forbidden
      if (resProfile.status === 401 || resProfile.status === 403) {
        router.push('/login');
        return;
      }

      const dataProfile = await resProfile.json();
      const dataInvoices = await resInvoices.json();
      const dataAnnounce = await resAnnounce.json();

      if (dataProfile?.success && dataProfile?.student) {
        const s = dataProfile.student;

        // Resolve candidate profile identifiers dynamically
        const resolvedName =
          s.fullName ||
          s.name ||
          s.user?.name ||
          dataInvoices?.studentDetails?.fullName ||
          'Verified Candidate';

        const resolvedCode =
          s.studentCode ||
          s.enrollmentNo ||
          dataInvoices?.studentDetails?.studentCode ||
          'VIQ-2026-101';

        const resolvedCourse =
          s.course?.title ||
          s.courseName ||
          dataInvoices?.courseDetails?.title ||
          'Full-Stack Web Development (MERN)';

        const resolvedBatch =
          s.center?.name ||
          s.batch ||
          dataInvoices?.courseDetails?.centerName ||
          '2026 Morning Cohort';

        const resolvedProgress =
          dataProfile.billingSummary?.progress ?? s.progress ?? 85;

        // Map and parse billing ledger records
        const paymentsList: PaymentRecord[] = (dataInvoices?.invoices || []).map((inv: any) => ({
          id: inv.id || inv.paymentId,
          receiptNo: inv.receiptNo || inv.invoiceNo || inv.id,
          amount: Number(inv.amount || 0),
          mode: inv.mode || inv.paymentMode || 'ONLINE',
          paymentDate: inv.paymentDate || inv.date || inv.createdAt,
          receiptUrl: inv.receiptUrl || inv.downloadUrl,
        }));

        const totalAmount = Number(dataInvoices?.billingSummary?.totalAmount ?? s.feePlan?.totalAmount ?? 0);
        const paidAmount = Number(dataInvoices?.billingSummary?.paidAmount ?? s.feePlan?.paidAmount ?? 0);
        const balance = Number(dataInvoices?.billingSummary?.balance ?? s.feePlan?.balance ?? (totalAmount - paidAmount));

        setStudent({
          id: s.id,
          name: resolvedName,
          enrollmentNo: resolvedCode,
          email: s.email || s.user?.email || '',
          courseName: resolvedCourse,
          batch: resolvedBatch,
          progress: resolvedProgress,
          feePlan: {
            totalAmount,
            paidAmount,
            balance,
            status: dataInvoices?.billingSummary?.status || s.feePlan?.status || 'PENDING',
            payments: paymentsList,
          },
        });

        if (Array.isArray(s.course?.notes)) {
          setNotes(s.course.notes);
        }

        if (Array.isArray(s.course?.tasks)) {
          const mappedTasks: TaskItem[] = s.course.tasks.map((t: any) => {
            const sub = Array.isArray(t.submissions) ? t.submissions[0] : null;
            return {
              id: t.id,
              title: t.title,
              description: t.description,
              dueDate: t.dueDate,
              submissionId: sub?.id,
              status: sub ? (sub.status === 'REVIEWED' ? 'REVIEWED' : 'SUBMITTED') : 'PENDING',
              submissionUrl: sub?.submissionUrl || '',
              fileUrls: sub?.fileUrls || [],
              remarks: sub?.remarks || '',
            };
          });
          setTasks(mappedTasks);
        }
      } else {
        router.push('/login');
      }

      if (dataAnnounce?.success) {
        setAnnouncements(dataAnnounce.circulars || dataAnnounce.announcements || []);
      }
    } catch (err) {
      console.error('Portal initialization failed:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Modal Handlers
  const openSubmissionModal = (task: TaskItem) => {
    setActiveSubmittingTask(task);
    setSubmissionUrl(task.submissionUrl || '');
    setLiveUrl('');
    setRemarks(task.remarks || '');
    setUploadedFiles([]);
    setErrorMsg('');
  };

  const closeSubmissionModal = () => {
    setActiveSubmittingTask(null);
    setSubmissionUrl('');
    setLiveUrl('');
    setRemarks('');
    setUploadedFiles([]);
    setErrorMsg('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // 2. Submit Handler (Handles GitHub repository, Live/Drive links, and local file uploads)
  const handleSubmitLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmittingTask) return;

    const primaryUrl = submissionUrl.trim() || liveUrl.trim();
    if (!primaryUrl && uploadedFiles.length === 0) {
      setErrorMsg('Please provide a repository/live link or attach at least one file.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('taskId', activeSubmittingTask.id);
      if (primaryUrl) formData.append('submissionUrl', primaryUrl);
      if (liveUrl.trim()) formData.append('liveUrl', liveUrl.trim());
      if (remarks.trim()) formData.append('remarks', remarks.trim());

      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/student/tasks/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit lab work');

      closeSubmissionModal();
      await loadPortalData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Unsubmit / Delete wrong submission
  const handleDeleteSubmission = async (task: TaskItem) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to unsubmit this assignment? You will be able to resubmit a new solution.'
    );
    if (!confirmDelete) return;

    setDeletingTaskId(task.id);
    try {
      const res = await fetch('/api/student/tasks/submit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          submissionId: task.submissionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to delete submission');

      await loadPortalData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete operation failed');
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (loading && !student) {
    return (
      <div className="student-portal-theme min-h-screen bg-[#07090e] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>Loading candidate workspace...</span>
        </div>
      </div>
    );
  }

  const totalFee = Number(student?.feePlan?.totalAmount || 0);
  const paidFee = Number(student?.feePlan?.paidAmount || 0);
  const dueBalance = Number(student?.feePlan?.balance || 0);
  const receiptsList = student?.feePlan?.payments || [];

  return (
    <div className="student-portal-theme min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 h-16 bg-[#0a0d14]/90 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <BrandLogo size={48} />
          <div>
            <span className="text-sm font-bold block text-white">VIQ Learning Cloud</span>
            {student?.enrollmentNo && (
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-medium">
                CANDIDATE ID: {student.enrollmentNo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const el = document.getElementById('receipts-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold hover:border-orange-500/40 hover:text-orange-400 transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-500" />
            <span>My Fee Receipt</span>
          </button>

          <ThemeToggle />
          <LogoutButton className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs hover:border-red-500/50 hover:text-red-400 transition cursor-pointer font-semibold" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-10 space-y-6">
        {/* Active Candidate Banner */}
        <div className="p-7 sm:p-8 rounded-3xl bg-[#0d121c] border border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> ACTIVE CANDIDATE WORKSPACE
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {student?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-1.5">
              <span>Enrolled Program:</span>
              <strong className="text-slate-200 font-semibold">{student?.courseName}</strong>
              {student?.batch && <span className="text-slate-500">({student.batch})</span>}
            </p>
          </div>

          <div>
            <Link
              href="/api/student/certificate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>View Digital Certificate</span>
            </Link>
          </div>
        </div>

        {/* Notice Board */}
        <div className="p-4 rounded-2xl bg-[#0d121c] border border-orange-500/20 space-y-2.5">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-mono uppercase font-bold tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>LIVE ACADEMIC NOTICE BOARD</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080b11] border border-white/[0.06] text-xs flex justify-between items-center">
            <span className="text-slate-300">
              {announcements.length > 0
                ? `${announcements[0]?.title}: ${announcements[0]?.content}`
                : 'Mid-Term Practical Cloud & VAPT Lab Assessment on Monday 10:00 AM'}
            </span>
            <span className="font-mono text-orange-400 font-extrabold text-[10px] tracking-wider bg-orange-500/10 px-2 py-0.5 rounded">
              NEW
            </span>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Curriculum Completion Telemetry
            </span>
            <span className="font-mono font-bold text-cyan-400">{student?.progress ?? 0}% COMPLETED</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#080b11] overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-orange-500 transition-all duration-700"
              style={{ width: `${student?.progress ?? 0}%` }}
            />
          </div>
        </div>

        {/* Notes & Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Curated Study Notes */}
          <div className="p-6 rounded-3xl bg-[#0d121c] border border-white/[0.07] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <h2 className="text-base font-bold text-white">Curated Study Notes</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                {notes.length} MODULE{notes.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No reference study notes available yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-2xl bg-[#080b11] border border-white/[0.05] flex items-center justify-between gap-4 text-xs hover:border-white/10 transition"
                  >
                    <span className="font-medium text-slate-200 truncate">{note.title}</span>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] shrink-0 transition"
                    >
                      Read PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Assignments & Tasks */}
          <div className="p-6 rounded-3xl bg-[#0d121c] border border-white/[0.07] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Lab Assignments & Tasks</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase">LIVE LABS</span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No assignments assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-[#080b11] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-200 block">{task.title}</span>
                      {task.status === 'SUBMITTED' || task.status === 'REVIEWED' ? (
                        <span className="text-[11px] text-emerald-400 font-mono block">
                          ✓ 1 file(s) submitted
                        </span>
                      ) : (
                        task.dueDate && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {task.status === 'REVIEWED' && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      )}

                      {task.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETED
                          </span>
                          <button
                            type="button"
                            title="Unsubmit or remove wrong submission"
                            onClick={() => handleDeleteSubmission(task)}
                            disabled={deletingTaskId === task.id}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                          >
                            {deletingTaskId === task.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {task.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => openSubmissionModal(task)}
                          className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] transition cursor-pointer shadow-md shadow-orange-500/20"
                        >
                          Submit Lab
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fee & Invoices Section */}
        <div id="receipts-section" className="p-6 sm:p-8 rounded-3xl bg-[#0d121c] border border-white/[0.07] space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Payment Receipts & Billing Ledger</h2>
                <p className="text-xs text-slate-400">Authenticated payment receipts issued by the center.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-bold">
              {receiptsList.length} RECORDED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-[#080b11] border border-white/[0.05] space-y-1">
              <span className="text-[11px] text-slate-500 block">Total Course Fee</span>
              <span className="text-xl font-bold font-mono text-white">₹{totalFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#080b11] border border-white/[0.05] space-y-1">
              <span className="text-[11px] text-slate-500 block">Paid Amount</span>
              <span className="text-xl font-bold font-mono text-emerald-400">₹{paidFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#080b11] border border-white/[0.05] space-y-1">
              <span className="text-[11px] text-slate-500 block">Pending Balance</span>
              <span className={`text-xl font-bold font-mono ${dueBalance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                ₹{dueBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {receiptsList.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-white/[0.08] rounded-2xl">
              No payment receipts recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono">
                  {receiptsList.map((p) => {
                    const identifier = p.receiptNo || p.id;
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-orange-400">{identifier}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 uppercase">{p.mode}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-sans">
                          <Link
                            href={`/receipt/${identifier}?from=student`}
                            className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition text-[11px] font-semibold"
                          >
                            View PDF
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Complete Multi-Format Submission Modal */}
      {activeSubmittingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e131f] border border-white/[0.1] max-w-lg w-full p-6 sm:p-7 rounded-3xl space-y-5 my-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div className="space-y-1 pr-4">
                <span className="text-[10px] font-mono uppercase text-orange-400 font-bold tracking-wider block">
                  LAB WORK SUBMISSION TERMINAL
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {activeSubmittingTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeSubmissionModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
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

            <form onSubmit={handleSubmitLab} className="space-y-4">
              {/* GitHub Link */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                  GitHub Repository Link
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full bg-[#080b11] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Live URL / Google Drive Link */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                  Live Project URL / Google Drive Link
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or live deployment link"
                    className="w-full bg-[#080b11] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Local File Direct Upload */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                  Direct File Upload (PDF, Video, Photos, ZIP)
                </label>
                <label className="border border-dashed border-white/[0.15] hover:border-orange-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#080b11]/50 hover:bg-[#080b11] transition block">
                  <UploadCloud className="w-6 h-6 text-orange-400" />
                  <span className="text-xs text-slate-300 font-medium text-center">
                    Click to browse files or drag and drop here
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    All standard formats supported (Max 50MB)
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Uploaded File List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-28 overflow-y-auto">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate text-slate-300">{file.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks / Testing Notes */}
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                  Submission Remarks / Execution Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Testing credentials or evaluation remarks..."
                  className="w-full bg-[#080b11] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSubmissionModal}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submitting ? 'Submitting...' : 'Submit Lab Work'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}