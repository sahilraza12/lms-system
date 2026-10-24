'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  GitBranch, 
  FileText, 
  X, 
  Loader2, 
  Send,
  MessageSquare,
  LogOut,
  ChevronRight,
  Sparkles,
  Inbox,
  UserCheck,
  Code2
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  fileUrl: string;
  remarks: string | null;
  submittedAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  student: {
    id: string;
    fullName: string;
    studentCode: string;
    course?: { title: string };
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  submissions: SubmissionItem[];
}

export default function TeacherTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Modal 1: Create Task Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal 2: Review / Feedback State
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionItem | null>(null);
  const [mentorFeedback, setMentorFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/teacher/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        if (data.tasks.length > 0) {
          setSelectedTask((prev) => 
            prev ? data.tasks.find((t: TaskItem) => t.id === prev.id) || data.tasks[0] : data.tasks[0]
          );
        }
      }
    } catch (err) {
      console.error('Failed to reload tasks:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialTasks() {
      try {
        setLoading(true);
        const response = await fetch('/api/teacher/tasks', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load tasks.');
        }

        setTasks(data.tasks || []);
        setSelectedTask(data.tasks?.[0] || null);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to load tasks:', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadInitialTasks();
    return () => controller.abort();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/teacher/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign lab task');

      setTitle('');
      setDescription('');
      setDueDate('');
      setIsCreateModalOpen(false);
      await loadTasks();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to assign lab task.');
    } finally {
      setCreating(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;
    setGrading(true);
    setGradeError('');

    try {
      const res = await fetch('/api/teacher/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: reviewingSubmission.id,
          status: 'REVIEWED',
          feedback: mentorFeedback.trim() || 'Verified by Mentor.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grading update failed');

      setReviewingSubmission(null);
      setMentorFeedback('');
      await loadTasks();
    } catch (err: unknown) {
      setGradeError(err instanceof Error ? err.message : 'Grading update failed.');
    } finally {
      setGrading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const totalSubmissions = tasks.reduce((acc, t) => acc + (t.submissions?.length || 0), 0);
  const reviewedSubmissions = tasks.reduce(
    (acc, t) => acc + (t.submissions?.filter((s) => s.status === 'REVIEWED').length || 0),
    0
  );
  const pendingSubmissions = totalSubmissions - reviewedSubmissions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Integrated Global Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-500/20">
              VIQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Faculty Mentor Workspace</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                  TEACHER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Ludhiana Campus &bull; Batch 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/dashboard/teacher"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/50 transition shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">&larr; Attendance Register</span>
              <span className="sm:hidden">&larr; Attendance</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Assign New Task</span>
            </button>

            <div className="h-6 w-px bg-slate-800 mx-0.5" />

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-slate-800/60">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Coursework Tasks & Lab Review Desk</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Publish technical milestones, inspect student GitHub repositories, and deliver mentor code review evaluations.
            </p>
          </div>
        </div>

        {/* 3. High-Contrast Dark KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xs shadow-xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Published Labs</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 font-mono tracking-tight">{tasks.length}</p>
            <span className="text-[11px] text-slate-400 mt-1 inline-block">Active assignment specifications</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xs shadow-xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400/90">Pending Review</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-400 mt-2 font-mono tracking-tight">{pendingSubmissions}</p>
            <span className="text-[11px] text-amber-400/70 mt-1 inline-block">Submissions awaiting grading</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xs shadow-xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400/90">Reviewed & Evaluated</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono tracking-tight">{reviewedSubmissions}</p>
            <span className="text-[11px] text-emerald-400/70 mt-1 inline-block">Feedback returned to candidates</span>
          </div>
        </div>

        {/* 4. Split Two-Column Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Assigned Lab Tasks (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 backdrop-blur-xs">
            <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-800/80">
              <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span>Assigned Lab Tasks</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold">
                {tasks.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                <p>Loading coursework...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
                <Inbox className="w-6 h-6 mx-auto text-slate-600" />
                <p>No tasks assigned yet. Click &ldquo;+ Assign New Task&rdquo; to set a milestone.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  const pendingCount = task.submissions?.filter((s) => s.status !== 'REVIEWED').length || 0;

                  return (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/80 text-white shadow-lg shadow-orange-950/30'
                          : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-orange-300' : 'text-slate-200'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {pendingCount} DUE
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-orange-400 translate-x-0.5' : 'text-slate-600'}`} />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-semibold">
                          {task.submissions?.length || 0} Submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Lab Specification & Submissions Board (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xs">
            {selectedTask ? (
              <>
                {/* Lab Details Header */}
                <div className="border-b border-slate-800/80 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                      LAB DETAILS
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Due Date: <span className="text-slate-200 font-semibold">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en-IN') : 'No Deadline'}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight leading-snug">{selectedTask.title}</h2>
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/70">
                      {selectedTask.description || 'No detailed instructions provided for this assignment.'}
                    </p>
                  </div>
                </div>

                {/* Candidate Submissions Queue */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-orange-400" />
                      <span>Candidate Submissions</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedTask.submissions?.length || 0} Received
                    </span>
                  </div>

                  {!selectedTask.submissions || selectedTask.submissions.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                      <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-semibold text-slate-300">No submissions received yet</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Candidates have not pushed their repository commits for this task yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTask.submissions.map((sub) => {
                        const isReviewed = sub.status === 'REVIEWED';

                        return (
                          <div
                            key={sub.id}
                            className="p-4 rounded-xl border border-slate-800 bg-slate-850 hover:border-slate-700/80 transition space-y-3 bg-slate-900/40"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-100 text-xs block">
                                  {sub.student.fullName}
                                </span>
                                <span className="text-[10px] font-mono text-orange-400 block mt-0.5">
                                  {sub.student.studentCode} {sub.student.course?.title ? `• ${sub.student.course.title}` : ''}
                                </span>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  isReviewed
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {isReviewed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {isReviewed ? 'REVIEWED' : 'AWAITING EVALUATION'}
                              </span>
                            </div>

                            {/* Links & Student Remarks */}
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                              {sub.fileUrl && (
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-mono font-bold text-xs truncate max-w-full hover:underline"
                                >
                                  <GitBranch className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">Inspect Repository / Demo Link</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              )}

                              {sub.remarks && (
                                <p className="text-[11px] text-slate-400 italic">
                                  &ldquo;{sub.remarks}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Action Footer */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                              <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingSubmission(sub);
                                  setMentorFeedback(sub.remarks || '');
                                  setGradeError('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{isReviewed ? 'Update Evaluation' : 'Review & Evaluate'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-700" />
                <p>Select an assignment on the left to review candidate submissions.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Modal 1: Assign New Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-slate-100">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Assign Cohort Milestone Task</h2>
                <p className="text-[11px] text-orange-400">Broadcasts immediately to all assigned students</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="px-6 py-2.5 bg-red-500/10 text-red-400 text-xs font-semibold border-b border-red-500/20">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build JWT Role-Based Auth Middleware"
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Submission Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs font-mono text-white [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deliverable Instructions & Acceptance Criteria
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify expected repository structure, required routes, or test suites..."
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs resize-none text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-orange-600/20"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Broadcasting...' : 'Publish Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Grade & Evaluation Feedback */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-slate-100">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Lab Evaluation & Code Review</h2>
                <p className="text-[11px] text-orange-400">
                  Candidate: {reviewingSubmission.student.fullName} ({reviewingSubmission.student.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {gradeError && (
              <div className="px-6 py-2.5 bg-red-500/10 text-red-400 text-xs font-semibold border-b border-red-500/20">
                {gradeError}
              </div>
            )}

            <form onSubmit={handleGradeSubmission} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                  Candidate Repository URL:
                </span>
                <a
                  href={reviewingSubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 font-mono font-bold text-xs flex items-center gap-1.5 hover:underline truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{reviewingSubmission.fileUrl}</span>
                </a>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mentor Code Review Remarks & Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={mentorFeedback}
                  onChange={(e) => setMentorFeedback(e.target.value)}
                  placeholder="Review findings: code architecture, error handling, edge cases, improvement areas..."
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs resize-none text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {grading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{grading ? 'Recording...' : 'Record Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}