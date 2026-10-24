'use client';

import { useEffect, useState } from 'react';

interface SubmissionItem {
  id: string;
  fileUrl: string;
  remarks: string | null;
  submittedAt: string;
  status: string;
  student: {
    fullName: string;
    studentCode: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  _count: {
    submissions: number;
  };
  submissions: SubmissionItem[];
}

export default function TeacherTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Task Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected Task for Submissions Modal
  const [activeTaskView, setActiveTaskView] = useState<TaskItem | null>(null);

  // Development fallback (In production, teacherId comes from session)
  const currentTeacherId = 'default-teacher-id';

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks/list?teacherId=${currentTeacherId}`);
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
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate || null,
          teacherId: currentTeacherId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch assignment');

      setTitle('');
      setDescription('');
      setDueDate('');
      setIsModalOpen(false);
      await fetchTasks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Course Assignments & Tasks</h1>
          <p className="text-sm text-slate-500">
            Publish coursework, set deadlines, and review student code/file submissions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
        >
          + Publish New Task
        </button>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
          Loading active assignments...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No assignments published yet. Click &quot;+ Publish New Task&quot; to assign work to your students.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                    {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No Deadline'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Submissions: <strong className="text-slate-900">{task._count.submissions}</strong>
                </span>
                <button
                  onClick={() => setActiveTaskView(task)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Review Work
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create New Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center text-white">
              <div>
                <h2 className="text-base font-bold">Assign New Task</h2>
                <p className="text-xs text-orange-400">Pushes directly to assigned batch students</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 px-6 py-2.5 text-xs font-semibold border-b border-red-100">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build REST API for Authentication"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide requirement details, acceptance criteria, or reference repos..."
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Dispatch Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Review Submissions View */}
      {activeTaskView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center text-white">
              <div>
                <h2 className="text-base font-bold">{activeTaskView.title}</h2>
                <p className="text-xs text-orange-400">
                  {activeTaskView.submissions.length} Submissions Received
                </p>
              </div>
              <button
                onClick={() => setActiveTaskView(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-sm">
              {activeTaskView.submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No students have uploaded their work for this assignment yet.
                </div>
              ) : (
                activeTaskView.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{sub.student.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{sub.student.studentCode}</div>
                      {sub.remarks && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          &quot;{sub.remarks}&quot;
                        </p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors inline-block"
                    >
                      Open Work Link ↗
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}