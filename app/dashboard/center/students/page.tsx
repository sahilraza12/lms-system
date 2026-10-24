'use client';

import { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  CreditCard, 
  BookOpen, 
  X, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail 
} from 'lucide-react';

interface StudentRosterItem {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  user?: { email: string };
  course?: { title: string; price: number };
  assignedTeacher?: { fullName: string; teacherCode: string } | null;
  feePlan?: {
    type: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
  } | null;
}

interface TeacherOption {
  id: string;
  fullName: string;
  teacherCode: string;
}

interface CourseOption {
  id: string;
  title: string;
  price: number;
  courseCode?: string;
}

export default function CenterStudentsPage() {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [centerId, setCenterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Admission
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [feeType, setFeeType] = useState<'ONE_TIME' | 'EMI'>('ONE_TIME');
  const [totalAmount, setTotalAmount] = useState<number>(35000);
  const [initialPayment, setInitialPayment] = useState<number>(10000);
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRoster = async () => {
    try {
      const res = await fetch('/api/center/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setTeachers(data.teachers);
        setCourses(data.courses);
        setCenterId(data.centerId);
        if (data.courses.length > 0 && !courseId) {
          setCourseId(data.courses[0].id);
          setTotalAmount(data.courses[0].price);
        }
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const selected = courses.find((c) => c.id === id);
    if (selected) {
      setTotalAmount(selected.price);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/center/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          studentCode,
          email,
          phone,
          password,
          courseId,
          teacherId: teacherId || null,
          centerId,
          feeType,
          totalAmount: Number(totalAmount),
          initialPayment: Number(initialPayment),
          installmentCount: Number(installmentCount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete admission');

      // Reset Form
      setFullName('');
      setStudentCode('');
      setEmail('');
      setPhone('');
      setPassword('');
      setTeacherId('');
      setInitialPayment(0);
      setIsModalOpen(false);
      await loadRoster();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to enroll student.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      s.user?.email.toLowerCase().includes(q) ||
      s.course?.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Branch Candidate Directory & Enrollment</h1>
          <p className="text-sm text-slate-500">
            Admit candidates, allocate faculty mentors, and monitor individualized tuition ledgers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const autoCode = `VIQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
            setStudentCode(autoCode);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Candidate Admission</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll code, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500 self-end sm:self-auto">
          Enrolled Candidates: <span className="text-slate-900">{filteredStudents.length}</span>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-6 py-4">Student Profile</th>
                <th className="px-6 py-4">Roll Code</th>
                <th className="px-6 py-4">Course Program</th>
                <th className="px-6 py-4">Assigned Mentor</th>
                <th className="px-6 py-4">Billing Status</th>
                <th className="px-6 py-4 text-right">Tuition Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                    Loading enrolled student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No student records match the search query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isPaid = s.feePlan?.status === 'PAID';
                  const isPartial = s.feePlan?.status === 'PARTIAL';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{s.fullName}</div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{s.user?.email}</span>
                        </div>
                        {s.phone && (
                          <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-orange-600 text-xs">
                        {s.studentCode}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium max-w-xs truncate">
                        {s.course?.title || 'Certification Track'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {s.assignedTeacher ? (
                          <div>
                            <span className="font-semibold text-slate-800">{s.assignedTeacher.fullName}</span>
                            <span className="block text-[10px] font-mono text-slate-400">{s.assignedTeacher.teacherCode}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unallocated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {s.feePlan?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <div className="font-bold text-slate-900">
                          ₹{s.feePlan?.paidAmount?.toLocaleString('en-IN') ?? 0}
                          <span className="text-slate-400 font-normal"> / ₹{s.feePlan?.totalAmount?.toLocaleString('en-IN') ?? 0}</span>
                        </div>
                        <div className="text-[11px] text-orange-600 font-bold">
                          Due: ₹{s.feePlan?.balance?.toLocaleString('en-IN') ?? 0}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Admission */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Candidate Admission Terminal</h2>
                <p className="text-xs text-orange-400">Initialize candidate profile, portal login, and billing plan</p>
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

            <form onSubmit={handleEnrollStudent} className="p-6 space-y-4 text-xs">
              {/* Section 1: Candidate Identity */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  1. Candidate Identity & Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Candidate's legal name"
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Roll / Student Code *</label>
                    <input
                      type="text"
                      required
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="VIQ-2026-101"
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 font-mono uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Candidate Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Initial Password *</label>
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
                </div>
              </div>

              {/* Section 2: Program & Mentor Allocation */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  2. Academic Track & Faculty Allocation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Enrolled Course *</label>
                    <select
                      required
                      value={courseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{c.price.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Faculty Mentor</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">-- Assign Later --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.teacherCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Billing & Fee Plan */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  3. Tuition Fee Plan Setup
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Billing Model</label>
                    <select
                      value={feeType}
                      onChange={(e) =>
                        setFeeType(e.target.value === 'EMI' ? 'EMI' : 'ONE_TIME')
                      }
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="ONE_TIME">One-Time Lumsum</option>
                      <option value="EMI">Monthly EMI Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Fee (₹)</label>
                    <input
                      type="number"
                      required
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 font-mono font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Initial Cash Advance (₹)</label>
                    <input
                      type="number"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 font-mono text-emerald-600 font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {feeType === 'EMI' && (
                    <div className="sm:col-span-3">
                      <label className="block text-slate-700 font-bold mb-1">Number of Installments</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                        className="w-full sm:w-1/3 px-3 py-2 border rounded-xl border-slate-300 font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  <span>{submitting ? 'Enrolling Candidate...' : 'Confirm Admission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}