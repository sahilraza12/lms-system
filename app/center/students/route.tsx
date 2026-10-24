'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Loader2,
  X,
  Receipt,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Phone,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sun,
  Moon,
  DollarSign,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  price?: number;
  totalFee?: number;
  courseCode?: string;
}

interface Teacher {
  id: string;
  fullName: string;
  teacherCode: string;
  specialization?: string;
}

interface FeePlan {
  id: string;
  type: 'ONE_TIME' | 'EMI';
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
  phone?: string;
  user?: { email: string };
  course?: { id: string; title: string; price?: number };
  assignedTeacher?: { id: string; fullName: string; teacherCode: string };
  feePlan?: FeePlan;
  createdAt: string;
}

export default function CenterStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centerId, setCenterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Admission Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  // Payment Collection Modal State
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payNotice, setPayNotice] = useState({ type: '', text: '' });

  // OTP Verification States
  const [otpStage, setOtpStage] = useState<'IDLE' | 'SENDING' | 'ENTER_CODE' | 'VERIFIED'>('IDLE');
  const [enteredOtp, setEnteredOtp] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    phone: '',
    password: '',
    dob: '2002-01-01',
    gender: 'Male',
    address: '',
    courseId: '',
    teacherId: '',
    feeType: 'ONE_TIME' as 'ONE_TIME' | 'EMI',
    totalAmount: 25000,
    initialPayment: 10000,
    installmentCount: 3,
    paymentMode: 'CASH',
  });

  // 1. Load candidates, courses, and teachers from database
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/center/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setCourses(data.courses || []);
        setTeachers(data.teachers || []);
        if (data.centerId) setCenterId(data.centerId);

        if (data.courses?.length > 0 && !formData.courseId) {
          setFormData((prev) => ({
            ...prev,
            courseId: data.courses[0].id,
            totalAmount: data.courses[0].price || 25000,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load students data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCourseChange = (selectedId: string) => {
    const foundCourse = courses.find((c) => c.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      courseId: selectedId,
      totalAmount: foundCourse?.price || prev.totalAmount,
    }));
  };

  // 2. Dispatch OTP to Student Email
  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setNotice({ type: 'error', text: 'Enter a valid official email address.' });
      return;
    }

    setOtpStage('SENDING');
    setNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, roleType: 'STUDENT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch verification code.');

      setOtpStage('ENTER_CODE');
      setNotice({
        type: 'success',
        text: `6-digit security code sent to ${formData.email} ${data.devOtp ? `(Dev Code: ${data.devOtp})` : ''}`,
      });
    } catch (err: any) {
      setOtpStage('IDLE');
      setNotice({ type: 'error', text: err.message });
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.trim().length < 6) {
      setNotice({ type: 'error', text: 'Enter the complete 6-digit OTP code.' });
      return;
    }

    setIsSubmitting(true);
    setNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: enteredOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP code.');

      setOtpStage('VERIFIED');
      setNotice({ type: 'success', text: 'Email ownership verified successfully!' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Enroll Student via Backend API
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStage !== 'VERIFIED') {
      setNotice({ type: 'error', text: 'Candidate email must be verified with OTP before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/center/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          centerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll student.');

      setNotice({ type: 'success', text: 'Candidate admitted and billing plan initialized!' });
      await loadData();

      setTimeout(() => {
        setIsModalOpen(false);
        setNotice({ type: '', text: '' });
        setOtpStage('IDLE');
        setEnteredOtp('');
        setFormData({
          fullName: '',
          studentCode: '',
          email: '',
          phone: '',
          password: '',
          dob: '2002-01-01',
          gender: 'Male',
          address: '',
          courseId: courses[0]?.id || '',
          teacherId: '',
          feeType: 'ONE_TIME',
          totalAmount: courses[0]?.price || 25000,
          initialPayment: 10000,
          installmentCount: 3,
          paymentMode: 'CASH',
        });
      }, 1500);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Collect EMI / Installment Payment
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;

    setIsSubmittingPay(true);
    setPayNotice({ type: '', text: '' });

    try {
      const res = await fetch(`/api/center/students/${selectedStudentForPay.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payAmount,
          paymentMode,
          transactionRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record installment payment.');

      setPayNotice({
        type: 'success',
        text: `Payment recorded! Receipt: ${data.receiptNo || 'Generated'}`,
      });
      setPayAmount('');
      setTransactionRef('');
      await loadData();

      setTimeout(() => {
        setSelectedStudentForPay(null);
        setPayNotice({ type: '', text: '' });
      }, 1500);
    } catch (err: any) {
      setPayNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen font-sans p-6 sm:p-10 space-y-8 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#07090E] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
        isDarkMode ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Users className="w-6 h-6 text-orange-500" />
            <span>Enrolled Students & Billing Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage candidates, fee clearances, and installment schedules for this branch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Functional Day / Night Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              isDarkMode
                ? 'border-white/10 bg-[#0E131F] text-slate-300 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Night Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setOtpStage('IDLE');
              setNotice({ type: '', text: '' });
            }}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs flex items-center gap-2 hover:bg-orange-400 transition cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Admit New Student (OTP)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, code, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500/50 ${
            isDarkMode
              ? 'bg-[#0D111A] border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        />
      </div>

      {/* Students Roster Table */}
      {loading ? (
        <div className={`py-24 text-center rounded-2xl border ${
          isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Loader2 className="w-7 h-7 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-mono">Loading candidates directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className={`py-20 text-center rounded-2xl border border-dashed space-y-3 ${
          isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            No Candidates Found
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click &quot;Admit New Student&quot; to enroll your branch candidates and configure fee plans.
          </p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-x-auto ${
          isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className={`border-b text-[10px] font-mono uppercase ${
              isDarkMode ? 'bg-white/[0.02] border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <tr>
                <th className="py-3.5 px-6">Candidate & Code</th>
                <th className="py-3.5 px-6">Course & Mentor</th>
                <th className="py-3.5 px-6">Billing Mode</th>
                <th className="py-3.5 px-6">Fee Paid / Total</th>
                <th className="py-3.5 px-6">Due Status</th>
                <th className="py-3.5 px-6 text-right">Collect EMI</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredStudents.map((s) => {
                const total = Number(s.feePlan?.totalAmount || 0);
                const paid = Number(s.feePlan?.paidAmount || 0);
                const balance = Number(s.feePlan?.balance || total - paid);
                const status = s.feePlan?.status || 'PENDING';

                return (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6">
                      <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {s.fullName}
                      </p>
                      <p className="text-[11px] font-mono text-orange-500 font-bold">{s.studentCode}</p>
                      <p className="text-[10px] text-slate-400">{s.user?.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {s.course?.title || 'General Engineering'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mentor: {s.assignedTeacher ? s.assignedTeacher.fullName : 'Unassigned'}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {s.feePlan?.type || 'ONE_TIME'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono">
                      <p className="text-emerald-500 font-bold">₹{paid.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400">of ₹{total.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-4 px-6 font-mono">
                      {balance > 0 ? (
                        <div>
                          <span className="text-orange-500 font-bold">₹{balance.toLocaleString('en-IN')}</span>
                          <span className="block text-[9px] uppercase tracking-wider text-amber-500 font-bold">
                            {status}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          Cleared ✓
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {balance > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForPay(s);
                            setPayNotice({ type: '', text: '' });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Record Pay</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-500 font-bold">Paid ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADMISSION & OTP VERIFICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-2xl border space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-[#0B0F17] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-4 ${
              isDarkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-500" />
                  <span>Admit Student with Official Email OTP</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces email ownership verification before saving user and fee records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-orange-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banner */}
            {notice.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  notice.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {notice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{notice.text}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Candidate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Student Roll Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU-2026-001"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 uppercase font-mono ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Official Email with OTP Verification */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  Official Student Email *
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    disabled={otpStage === 'VERIFIED'}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 disabled:opacity-50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={otpStage === 'VERIFIED' || otpStage === 'SENDING'}
                    onClick={handleSendOtp}
                    className="px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-500 font-bold hover:bg-orange-500 hover:text-black transition cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {otpStage === 'SENDING' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : otpStage === 'VERIFIED' ? (
                      'Verified ✓'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </div>

              {/* OTP Input Card */}
              {otpStage === 'ENTER_CODE' && (
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                  <label className="text-[10px] font-mono uppercase text-orange-500 font-bold block">
                    Enter 6-Digit Email Verification Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border border-orange-500/30 font-mono tracking-widest text-center text-sm ${
                        isDarkMode ? 'bg-[#07090E] text-white' : 'bg-white text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-black font-bold hover:bg-orange-400 transition cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Candidate phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Course & Mentor Assignment Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Course Selection *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 cursor-pointer ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className={isDarkMode ? 'bg-[#121620]' : 'bg-white'}>
                        {course.title} (₹{(course.price || course.totalFee || 25000).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Assign Faculty / Teacher
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 cursor-pointer ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="">Unassigned (Optional)</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id} className={isDarkMode ? 'bg-[#121620]' : 'bg-white'}>
                        {teacher.fullName} ({teacher.teacherCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fee Configuration */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t ${
                isDarkMode ? 'border-white/10' : 'border-slate-200'
              }`}>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Payment Plan
                  </label>
                  <select
                    value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value as 'ONE_TIME' | 'EMI' })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="ONE_TIME">One-Time Fee</option>
                    <option value="EMI">EMI Schedule</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Advance Collected (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.initialPayment}
                    onChange={(e) => setFormData({ ...formData, initialPayment: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                {formData.feeType === 'EMI' && (
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Installment Months
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.installmentCount}
                      onChange={(e) => setFormData({ ...formData, installmentCount: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-mono ${
                        isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className={`flex items-center gap-3 pt-4 border-t ${
                isDarkMode ? 'border-white/10' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                    isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpStage !== 'VERIFIED' || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Admission...</span>
                    </>
                  ) : (
                    <span>Complete Admission</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT INSTALLMENT PAYMENT & GENERATE RECEIPT */}
      {selectedStudentForPay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 sm:p-8 rounded-2xl border space-y-6 shadow-2xl relative ${
            isDarkMode ? 'bg-[#0B0F17] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-start justify-between border-b pb-4 ${
              isDarkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <span>Collect EMI / Fee Installment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  For: <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedStudentForPay.fullName}</span> ({selectedStudentForPay.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForPay(null)}
                className="text-slate-400 hover:text-orange-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payNotice.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  payNotice.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {payNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{payNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1 ${
                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-slate-400">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-bold text-orange-500 font-mono">
                    ₹{Number(selectedStudentForPay.feePlan?.balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:border-orange-500/50 ${
                    isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Net Banking</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                    Ref / UTR No.
                  </label>
                  <input
                    type="text"
                    placeholder="Txn ID"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPay(null)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                    isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Record & Receipt</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}