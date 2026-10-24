'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Award, 
  Receipt, 
  Megaphone, 
  Sparkles,
  UploadCloud,
  GitBranch,
  Globe,
  X,
  File as FileIcon,
  CheckCircle2,
  Trash2,
  Send,
  RotateCcw,
  Loader2
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface SubmissionData {
  id: string;
  submissionUrl?: string;
  fileUrls?: string[];
  remarks: string | null;
  submittedAt?: string;
  status: string;
  feedback?: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  submissions?: SubmissionData[];
  status?: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  submissionUrl?: string;
  liveLink?: string;
  remarks?: string;
}

interface TaskApiItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  submissions?: {
    status: string;
    submissionUrl?: string | null;
    fileUrl?: string | null;
    remarks?: string | null;
  }[];
}

interface NoteItem {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
}

interface StudentProfile {
  id: string;
  name: string;
  enrollmentNo: string;
  courseName: string;
  batch: string;
  progress: number;
  certificateId: string;
  receiptId: string;
}

export default function StudentPortalPage() {
  const [student, setStudent] = useState<StudentProfile>({
    id: '',
    name: 'Candidate',
    enrollmentNo: 'VIQ-2026-101',
    courseName: 'Full-Stack Web Development',
    batch: 'Academic Cohort',
    progress: 85,
    certificateId: 'VIQ-2026-101',
    receiptId: 'RCP-2026-101',
  });

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeSubmittingTask, setActiveSubmittingTask] = useState<TaskItem | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch live student profile, notes, and tasks mapped to session
  const loadPortalData = useCallback(async () => {
    try {
      const [resProfile, resTasks] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/tasks'),
      ]);

      const dataProfile = await resProfile.json();
      const dataTasks = await resTasks.json();

      if (dataProfile.success && dataProfile.student) {
        const s = dataProfile.student;
        setStudent({
          id: s.id,
          name: s.fullName,
          enrollmentNo: s.studentCode,
          courseName: s.course?.title || 'Full-Stack Web Development',
          batch: s.center?.name || 'Academic Batch',
          progress: 85,
          certificateId: s.studentCode,
          receiptId: s.studentCode,
        });

        if (s.course?.notes) {
          setNotes(s.course.notes);
        }
      }

      if (dataTasks.success && dataTasks.tasks) {
        const mapped: TaskItem[] = dataTasks.tasks.map((t: TaskApiItem) => {
          const sub = t.submissions && t.submissions[0];
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            status: sub ? (sub.status === 'REVIEWED' ? 'REVIEWED' : 'SUBMITTED') : 'PENDING',
            submissionUrl: sub?.submissionUrl || sub?.fileUrl || '',
            remarks: sub?.remarks || '',
          };
        });
        setTasks(mapped);
      }
    } catch (err) {
      console.error('Portal load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const openSubmissionModal = (task: TaskItem) => {
    setActiveSubmittingTask(task);
    setSubmissionUrl(task.submissionUrl || '');
    setLiveUrl(task.liveLink || '');
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

  // 2. Submit task with schema-aligned keys
  const handleSubmitLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmittingTask) return;

    const finalUrl = submissionUrl.trim() || liveUrl.trim();
    if (!finalUrl) {
      setErrorMsg('Please provide a valid GitHub repository or live project link.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeSubmittingTask.id,
          studentId: student.id,
          submissionUrl: finalUrl,
          fileUrl: finalUrl,
          remarks: remarks || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit assignment');

      closeSubmissionModal();
      await loadPortalData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Reset / Unsubmit task handler
  const handleDeleteSubmission = async (taskId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to unsubmit this lab? You can submit an updated version afterwards.'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          studentId: student.id,
          unsubmit: true,
        }),
      });

      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'PENDING', submissionUrl: '' } : t))
        );
      } else {
        await loadPortalData();
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'PENDING', submissionUrl: '' } : t))
      );
    }
  };

  return (
    <div className="viq-page min-h-screen font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Student Navbar */}
      <header className="sticky top-0 z-40 h-16 viq-nav px-6 sm:px-12 flex items-center justify-between border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="viq-btn-primary w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs">
            VIQ
          </div>
          <div>
            <span className="text-sm font-bold block">VIQ Learning Cloud</span>
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest block">
              CANDIDATE ID: {student.enrollmentNo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/student/fees`}
            className="hidden sm:inline-flex items-center gap-1.5 viq-pill px-3.5 py-2 text-xs font-bold"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-500" />
            <span>My Fee Ledger</span>
          </Link>

          <ThemeToggle />

          <LogoutButton className="viq-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs hover:border-red-500 hover:text-red-500 transition cursor-pointer font-bold disabled:opacity-60" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-12 space-y-8">
        {/* Welcome Banner */}
        <div className="viq-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--bg-glass-subtle)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 viq-pill px-3 py-1 text-cyan-600 dark:text-cyan-400 text-[11px] font-mono uppercase">
              <Sparkles className="w-3 h-3" /> Active Candidate Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {student.name}
            </h1>
            <p className="text-xs sm:text-sm viq-text-secondary">
              Enrolled Program:{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {student.courseName}
              </span>{' '}
              ({student.batch})
            </p>
          </div>

          <Link
            href={`/dashboard/student/fees`}
            className="viq-btn-primary px-5 py-3 text-xs flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Award className="w-4 h-4" />
            <span>Academic Standing</span>
          </Link>
        </div>

        {/* Notice Board */}
        <div className="viq-card p-4 space-y-2 bg-amber-500/[0.04] border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-mono uppercase font-bold">
            <Megaphone className="w-4 h-4" />
            <span>Live Academic Notice Board</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs flex justify-between items-center">
            <span>Project submission window is open. Ensure git repositories are public.</span>
            <span className="font-mono text-amber-500 font-bold text-[10px]">ACTIVE</span>
          </div>
        </div>

        {/* Course Progress */}
        <div className="viq-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              Curriculum Completion Telemetry
            </span>
            <span className="font-mono font-bold text-cyan-500">{student.progress}% COMPLETED</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--bg-glass-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 transition-all duration-700"
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>

        {/* Notes & Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Curated Study Notes */}
          <div className="viq-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <h2 className="text-base font-bold">Curated Study Notes</h2>
              </div>
              <span className="text-[11px] font-mono viq-text-muted">
                {notes.length} MODULE{notes.length !== 1 ? 'S' : ''}
              </span>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs viq-text-muted">No reference notes uploaded for this module yet.</p>
            ) : (
              <div className="space-y-2.5">
                {notes.map((note) => (
                  <div key={note.id} className="viq-pill p-3.5 flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium truncate">{note.title}</span>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="viq-btn-primary px-3 py-1.5 text-[11px] shrink-0"
                    >
                      Read PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Assignments & Tasks */}
          <div className="viq-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <h2 className="text-base font-bold">Lab Assignments & Tasks</h2>
              </div>
              <span className="text-[11px] font-mono viq-text-muted">
                {tasks.length} ASSIGNMENT{tasks.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs viq-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Loading assigned coursework...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-xs viq-text-muted">
                No tasks assigned by your mentor yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="viq-pill p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold block leading-snug">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {task.status === 'REVIEWED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          REVIEWED
                        </span>
                      )}

                      {task.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px]">
                            PENDING REVIEW
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubmission(task.id)}
                            className="p-1 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Unsubmit and edit"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {task.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => openSubmissionModal(task)}
                          className="viq-btn-primary px-3.5 py-1.5 text-[11px] cursor-pointer"
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
      </main>

      {/* LAB SUBMISSION MODAL */}
      {activeSubmittingTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="viq-card bg-[var(--bg-primary)] max-w-lg w-full p-6 space-y-5 my-auto shadow-2xl border border-[var(--border-color)]">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2 text-orange-500 font-mono text-[11px] font-bold uppercase">
                  <UploadCloud className="w-4 h-4" />
                  <span>Lab Work Submission Terminal</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold leading-snug">
                  {activeSubmittingTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeSubmissionModal}
                className="p-1.5 rounded-lg hover:bg-white/10 viq-text-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitLab} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  GitHub Repository Link *
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://github.com/username/project-repo"
                    className="viq-input w-full pl-9 pr-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Live Demo / Deployment URL (Optional)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-cyan-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://deployed-app.vercel.app"
                    className="viq-input w-full pl-9 pr-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Upload Lab Documentation (Optional)
                </label>
                <label className="viq-input w-full p-3.5 text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer border-dashed border-2 hover:border-orange-500 transition text-center bg-[var(--bg-glass-subtle)]">
                  <UploadCloud className="w-5 h-5 text-orange-500" />
                  <span className="font-bold">Attach project files or screenshots</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="text-[10px] font-mono uppercase font-bold text-orange-500 block">
                    Selected Files ({uploadedFiles.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[var(--bg-glass-subtle)] text-[11px]"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FileIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i))}
                          className="text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                  Submission Notes / Credentials (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Testing steps, environment variables, or admin logins..."
                  className="viq-input w-full px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSubmissionModal}
                  className="flex-1 py-2.5 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl viq-btn-primary text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submitting ? 'Submitting...' : 'Submit Assessment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}