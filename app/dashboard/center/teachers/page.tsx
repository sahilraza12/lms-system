'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  GraduationCap, 
  BookOpen, 
  Phone, 
  Mail, 
  UserPlus, 
  X, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface StudentBrief {
  id: string;
  fullName: string;
  studentCode: string;
  course?: { title: string };
}

interface TeacherItem {
  id: string;
  teacherCode: string;
  fullName: string;
  phone: string;
  specialization: string;
  user?: { email: string };
  students: StudentBrief[];
  _count: {
    students: number;
    tasks: number;
  };
}

export default function CenterTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentBrief[]>([]);
  const [centerId, setCenterId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal 1: Onboard Teacher
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal 2: Batch Allocation
  const [allocatingTeacher, setAllocatingTeacher] = useState<TeacherItem | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allocating, setAllocating] = useState(false);
  const [allocError, setAllocError] = useState('');

  const loadFacultyData = async () => {
    try {
      const res = await fetch('/api/center/teachers');
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
        setUnassignedStudents(data.unassignedStudents || []);
        setCenterId(data.centerId || '');
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/center/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          teacherCode,
          email,
          phone,
          specialization,
          password,
          centerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard instructor');

      setFullName('');
      setTeacherCode('');
      setEmail('');
      setPhone('');
      setSpecialization('');
      setPassword('');
      setIsTeacherModalOpen(false);
      await loadFacultyData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocateStudents = async () => {
    if (!allocatingTeacher || selectedStudentIds.length === 0) return;
    setAllocating(true);
    setAllocError('');

    try {
      const res = await fetch('/api/center/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: allocatingTeacher.id,
          studentIds: selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Allocation failed');

      setSelectedStudentIds([]);
      setAllocatingTeacher(null);
      await loadFacultyData();
    } catch (err: unknown) {
      setAllocError(err instanceof Error ? err.message : 'Failed to assign students.');
    } finally {
      setAllocating(false);
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Faculty Mentors & Batch Allocation Desk</h1>
          <p className="text-sm text-slate-500">
            Onboard instructors, review cohort student counts, and allocate unassigned candidates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const autoCode = `TCH-${Math.floor(100 + Math.random() * 900)}`;
            setTeacherCode(autoCode);
            setIsTeacherModalOpen(true);
          }}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Faculty Mentor</span>
        </button>
      </div>

      {/* Unassigned Students Alert Callout */}
      {unassignedStudents.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-800 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{unassignedStudents.length} candidate(s)</strong> are currently awaiting faculty mentor allocation.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-500/20 px-2.5 py-1 rounded-lg">
            Needs Cohort Mapping
          </span>
        </div>
      )}

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
          Loading branch faculty mentors...
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          No faculty mentors registered under this branch yet. Click &quot;+ Onboard Faculty Mentor&quot; to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                      {teacher.teacherCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                      {teacher.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{teacher.specialization}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.user?.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Cohort Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort Size</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {teacher._count.students}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Labs Assigned</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {teacher._count.tasks}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAllocatingTeacher(teacher);
                    setSelectedStudentIds([]);
                    setAllocError('');
                  }}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-orange-400" />
                  <span>Map Candidate Batch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Onboard Faculty Mentor */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Onboard Faculty Mentor</h2>
                <p className="text-xs text-orange-400">Setup instructor profile & portal login credentials</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
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

            <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Instructor Name"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Teacher Code *</label>
                  <input
                    type="text"
                    required
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="TCH-101"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 font-mono uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Portal Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@viqtech.in"
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Domain Specialization *</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. MERN Stack & Next.js"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Passkey *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{submitting ? 'Onboarding...' : 'Confirm Provisioning'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Candidate Allocation to Mentor */}
      {allocatingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Allocate Candidates to Cohort</h2>
                <p className="text-xs text-orange-400">
                  Mentor: {allocatingTeacher.fullName} ({allocatingTeacher.teacherCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllocatingTeacher(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {allocError && (
              <div className="px-6 py-2.5 bg-red-50 text-red-700 text-xs font-semibold border-b border-red-100">
                {allocError}
              </div>
            )}

            <div className="p-6 space-y-4 text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Select from unassigned branch candidates ({unassignedStudents.length} available)
              </span>

              {unassignedStudents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-slate-400">
                  All active candidates are currently mapped to a faculty mentor.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {unassignedStudents.map((s) => {
                    const isSelected = selectedStudentIds.includes(s.id);

                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudentSelection(s.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-50/60 border-orange-500 text-slate-900'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{s.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{s.studentCode}</span>
                          <span className="text-[11px] text-slate-500">{s.course?.title}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600">
                  Selected: {selectedStudentIds.length} candidate(s)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocatingTeacher(null)}
                    className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={allocating || selectedStudentIds.length === 0}
                    onClick={handleAllocateStudents}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    {allocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{allocating ? 'Mapping...' : 'Confirm Allocation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}