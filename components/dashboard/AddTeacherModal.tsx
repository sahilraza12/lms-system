'use client';

import { useState } from 'react';

interface TeacherOption {
  id: string;
  fullName: string;
  teacherCode: string;
}

interface CourseOption {
  id: string;
  title: string;
  price?: number;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherOption[];
  courses: CourseOption[];
  onSuccess?: () => void;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  teachers,
  courses,
  onSuccess,
}: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('2002-01-01');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  // Financial Ledger Fields
  const [totalAmount, setTotalAmount] = useState<number>(35000);
  const [downPayment, setDownPayment] = useState<number>(10000);
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');

  if (!isOpen) return null;

  const remainingBalance = Math.max(0, totalAmount - downPayment);
  const estimatedEmi = installmentCount > 0 ? Math.round(remainingBalance / installmentCount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!courseId) {
      setErrorMsg('Please select an enrolled course for this candidate.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/center/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          studentCode,
          email,
          password,
          phone,
          dob,
          gender,
          address,
          courseId,
          teacherId: teacherId || null,
          totalAmount: Number(totalAmount),
          downPayment: Number(downPayment),
          installmentCount: Number(installmentCount),
          paymentMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete admission process');

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFullName('');
    setStudentCode('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setCourseId('');
    setTeacherId('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 flex justify-between items-center text-white">
          <div>
            <h2 className="text-base font-bold">New Student Admission & Ledger Setup</h2>
            <p className="text-xs text-orange-400">Enroll student, assign mentor, and structure fee schedule</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 px-6 py-2.5 text-xs font-semibold border-b border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {/* Section 1: Candidate Bio */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">1. Identity & Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Student Full Name"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll / Student Code *</label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="STU-2026-001"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Course & Mentor Mapping */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">2. Academic Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enrolled Course *</label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Mentor / Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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

          {/* Section 3: Fee Structuring & Down Payment */}
          <div className="border-t border-slate-100 pt-4 bg-slate-50 -mx-6 px-6 py-4 rounded-b-xl border-b">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">3. Billing & EMI Structuring</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Fee (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Down Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque / DD</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">EMI Installments</label>
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={1}>1 (Full Remaining)</option>
                  <option value={2}>2 Installments</option>
                  <option value={3}>3 Installments</option>
                  <option value={6}>6 Installments</option>
                  <option value={10}>10 Installments</option>
                </select>
              </div>
            </div>

            {/* Live Financial Feedback Summary */}
            <div className="mt-3 flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">
                Remaining Balance: <strong className="text-orange-600 font-mono">₹{remainingBalance.toLocaleString('en-IN')}</strong>
              </span>
              {installmentCount > 1 && remainingBalance > 0 && (
                <span className="text-slate-500">
                  Approx. EMI: <strong className="text-slate-800 font-mono">₹{estimatedEmi.toLocaleString('en-IN')}/month</strong> ({installmentCount} months)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'Admitting & Generating Receipt...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}