'use client';

import { useEffect, useState } from 'react';

interface SubmissionData {
  id: string;
  fileUrl: string;
  remarks: string | null;
  submittedAt: string;
  status: string;
}

interface StudentTask {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  submissions: SubmissionData[];
}

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission Modal States
  const [activeTask, setActiveTask] = useState<StudentTask | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTasks = async () => {
    try {

      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openSubmitModal = (task: StudentTask) => {
    setActiveTask(task);
    const existingSubmission = task.submissions[0];
    setFileUrl(existingSubmission?.fileUrl || '');
    setRemarks(existingSubmission?.remarks || '');
    setErrorMsg('');
  };

  const closeSubmitModal = () => {
    setActiveTask(null);
    setFileUrl('');
    setRemarks('');
    setErrorMsg('');
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeTask.id,
          fileUrl,
          remarks: remarks || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit assignment');

      closeSubmitModal();
      await loadTasks();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Assigned Tasks</h1>
        <p className="text-sm text-slate-500">
          Track deadlines, access assignment prompts, and submit project links directly to your mentor.
        </p>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
          Loading assigned tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No tasks assigned by your mentor yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const submission = task.submissions[0];
            const isSubmitted = !!submission;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isSubmitted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {task.dueDate
                        ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                        : 'No Deadline'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{task.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isSubmitted ? (
                    <span className="text-[11px] text-slate-400">
                      Turned in: {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-orange-600 font-medium">Awaiting Submission</span>
                  )}

                  <button
                    onClick={() => openSubmitModal(task)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      isSubmitted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isSubmitted ? 'Update Submission' : 'Submit Work'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center text-white">
              <div>
                <h2 className="text-base font-bold">Submit Assignment</h2>
                <p className="text-xs text-orange-400 truncate max-w-xs">{activeTask.title}</p>
              </div>
              <button
                onClick={closeSubmitModal}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 px-6 py-2.5 text-xs font-semibold border-b border-red-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Link (GitHub / Drive / Demo URL) *
                </label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Key features implemented, deployment credentials, or queries..."
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Turn In Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}