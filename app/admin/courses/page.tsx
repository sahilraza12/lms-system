'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, Clock, Sparkles } from 'lucide-react';

interface MasterCourse {
  id: string;
  name: string;
  code: string;
  duration: string;
  fee: number;
  description: string;
}

const INITIAL_COURSES: MasterCourse[] = [
  {
    id: 'crs-1',
    name: 'Full-Stack Web Development (MERN)',
    code: 'VIQ-FS-101',
    duration: '6 Months',
    fee: 25000,
    description: 'Master MongoDB, Express, React, Node.js and Next.js for enterprise applications.',
  },
  {
    id: 'crs-2',
    name: 'Cybersecurity & Ethical Hacking',
    code: 'VIQ-SEC-202',
    duration: '4 Months',
    fee: 20000,
    description: 'Learn VAPT, network security, penetration testing, and digital forensics.',
  },
  {
    id: 'crs-3',
    name: 'AI & Machine Learning with Python',
    code: 'VIQ-AI-303',
    duration: '6 Months',
    fee: 28000,
    description: 'Deep dive into Data Science, Neural Networks, and predictive cloud analytics.',
  },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<MasterCourse[]>(INITIAL_COURSES);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState('6 Months');
  const [fee, setFee] = useState('25000');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.courses || [];
          if (list.length > 0) setCourses(list);
        }
      } catch {}
    }
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newCourse: MasterCourse = {
      id: `crs-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      duration,
      fee: Number(fee) || 20000,
      description: description || 'Industry-aligned certification program with live lab evaluations.',
    };

    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
    } catch {}

    setCourses([newCourse, ...courses]);
    setName('');
    setCode('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Master Curriculum & Programs
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Publish standardized VIQ courses and tuition benchmarks across all partner centers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="viq-btn-primary inline-flex items-center gap-2 px-5 py-3 text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Program</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="viq-card p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="viq-pill px-3 py-1 text-indigo-500 font-bold text-[11px] font-mono border-indigo-500/30">
                  {c.code}
                </span>
                <span className="flex items-center gap-1 text-xs font-mono viq-text-secondary font-bold">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  {c.duration}
                </span>
              </div>

              <h3 className="text-lg font-black leading-snug">{c.name}</h3>
              <p className="text-xs viq-text-secondary leading-relaxed font-medium">{c.description}</p>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase viq-text-muted font-bold block">Standard Tuition</span>
                <span className="text-xl font-black text-emerald-500 font-mono">
                  ₹{Number(c.fee).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">● SYNCED</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="viq-card bg-[var(--bg-primary)] max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black">Create Master Program</h3>
              <p className="text-xs viq-text-secondary">Deploy a new course to the VIQ public catalog.</p>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cloud DevOps & Kubernetes"
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Program Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VIQ-DEV-404"
                    className="viq-input w-full px-4 py-3 text-xs uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="6 Months"
                    className="viq-input w-full px-4 py-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Standard Tuition Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="viq-input w-full px-4 py-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Syllabus Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key modules, tools, and learning outcomes..."
                  className="viq-input w-full px-4 py-3 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl viq-btn-primary text-xs transition"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}