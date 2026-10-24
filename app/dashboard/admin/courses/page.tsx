'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  IndianRupee, 
  Clock, 
  Users, 
  GraduationCap, 
  X, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  courseCode?: string | null;
  description?: string | null;
  price: number;
  durationWeeks?: number | null;
  level?: string | null;
  createdAt: string;
  _count?: {
    students: number;
  };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(35000);
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [level, setLevel] = useState('INTERMEDIATE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/courses')
      .then((response) => response.json())
      .then((data) => {
        if (active && data.success && data.courses) setCourses(data.courses);
      })
      .catch((err: unknown) => {
        if (active) console.error('Failed to load courses:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          courseCode: courseCode || null,
          description,
          price: Number(price),
          durationWeeks: Number(durationWeeks),
          level,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      // Reset
      setTitle('');
      setCourseCode('');
      setDescription('');
      setPrice(35000);
      setDurationWeeks(12);
      setLevel('INTERMEDIATE');
      setIsModalOpen(false);
      await loadCourses();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCatalogValue = courses.reduce((acc, c) => acc + (c.price * (c._count?.students || 0)), 0);
  const totalEnrolled = courses.reduce((acc, c) => acc + (c._count?.students || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Curriculum & Course Catalog</h1>
          <p className="text-sm text-slate-500">
            Publish academic programs, adjust standard enrollment tariffs, and monitor cohort sizes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Programs</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{courses.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Active Certifications</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled Cohort</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">{totalEnrolled}</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Students across all courses</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Catalog Enrollment Value</span>
            <IndianRupee className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 mt-2 font-mono">
            ₹{totalCatalogValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Gross estimated course volume</span>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
          Loading course programs...
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          No courses published yet. Click &quot;+ Add New Course&quot; to launch your first training curriculum.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                    {course.courseCode || 'COURSE'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {course.level || 'INTERMEDIATE'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {course.description || 'Comprehensive industry curriculum covering architecture, projects, and deployment.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {course.durationWeeks || 12} Weeks
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {course._count?.students || 0} Enrolled
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Fee</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      ₹{course.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Course */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Publish New Course Program</h2>
                <p className="text-xs text-orange-400">Configure pricing tariff and syllabus details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="px-6 py-2.5 bg-red-50 text-red-700 text-xs font-semibold border-b border-red-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Full-Stack Web Development"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="FSW-101"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Curriculum Overview
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technologies covered, real-world capstone projects, lab tracks..."
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standard Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Weeks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proficiency Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{submitting ? 'Publishing...' : 'Launch Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}