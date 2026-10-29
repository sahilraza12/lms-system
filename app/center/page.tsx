'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Users,
  UserCheck,
  Plus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  FileText,
  Trash2,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
  Menu,
  Receipt,
  BellRing,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';

interface StudentItem {
  id: string;
  fullName: string;
  studentCode: string;
  courseTitle: string;
  paidAmount: number;
  dueAmount: number;
  email?: string;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const COURSES = [
  'Full-Stack Web Development',
  'Cybersecurity & VAPT',
  'AI & Machine Learning',
  'Cloud Computing & DevOps',
];

export default function CenterDashboardPage() {
  const router = useRouter();

  // Active View Department
  const [activeTab, setActiveTab] = useState<'revenue' | 'admissions' | 'teachers' | 'tasks' | 'settings'>('revenue');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Day / Night Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Live Database Overview Metrics
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [realStats, setRealStats] = useState({
    totalGrossCollected: 0,
    netRetainedShare: 0,
    totalPendingEmis: 0,
    activeStudentsCount: 0,
    hqRoyalty: 0,
    royaltyRate: 25,
  });

  // Target Revenue Calculator
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [avgFee, setAvgFee] = useState<number>(22000);
  const totalGross = studentsCount * avgFee;
  const hqRoyalty = Math.round((totalGross * realStats.royaltyRate) / 100);
  const centerNetProfit = totalGross - hqRoyalty;

  // Students State
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Admission Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [totalFee, setTotalFee] = useState('25000');
  const [downPayment, setDownPayment] = useState('12500');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');

  // Payment Recording Modal State
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<StudentItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payNotice, setPayNotice] = useState({ type: '', text: '' });

  // EMI Alert Notification Triggers (Bulk & Individual)
  const [dispatchingEmiAlerts, setDispatchingEmiAlerts] = useState(false);
  const [singleSendingId, setSingleSendingId] = useState<string | null>(null);
  const [emiNotice, setEmiNotice] = useState({ type: '', text: '' });

  // Teachers State
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  // OTP Verification States
  const [otpStage, setOtpStage] = useState<'IDLE' | 'SENDING' | 'ENTER_OTP' | 'VERIFIED'>('IDLE');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTargetType, setOtpTargetType] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [otpNotice, setOtpNotice] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tasks State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBatch, setTaskBatch] = useState(COURSES[0]);
  const [taskUrl, setTaskUrl] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Deploy Multi-Role Authentication with Next.js & JWT',
      course: 'Full-Stack Web Development',
      due: '2026-10-25',
    },
    {
      id: '2',
      title: 'Perform Vulnerability Assessment on Local Target (DVWA)',
      course: 'Cybersecurity & VAPT',
      due: '2026-10-28',
    },
  ]);

  // 1. Fetch Overview Data
  const fetchOverviewData = async () => {
    try {
      setLoadingMetrics(true);
      const res = await fetch('/api/center/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          const gross = Number(data.stats.totalGrossCollected || 0);
          const retained = Number(data.stats.netRetainedShare ?? (gross - Number(data.stats.hqRoyalty ?? 0)));
          const royalty = Number(data.stats.hqRoyalty !== undefined ? data.stats.hqRoyalty : gross - retained);

          setRealStats({
            totalGrossCollected: gross,
            netRetainedShare: retained,
            totalPendingEmis: Number(data.stats.totalPendingEmis || 0),
            activeStudentsCount: Number(data.stats.activeStudentsCount || 0),
            hqRoyalty: royalty,
            royaltyRate: Number(data.stats.royaltyRate ?? 25),
          });
          setStudentsCount(Number(data.stats.activeStudentsCount || 0));
        }
      }
    } catch (err) {
      console.error('Failed to load live overview metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // 2. Fetch Students from Database
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await fetch('/api/center/students');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.students || []).map((s: any) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode || s.enrollmentNo || 'STU-VIQ',
          courseTitle: s.course?.title || 'Engineering',
          paidAmount: Number(s.feePlan?.paidAmount || 0),
          dueAmount: Number(s.feePlan?.balance || (Number(s.feePlan?.totalAmount || 0) - Number(s.feePlan?.paidAmount || 0))),
          email: s.user?.email || '',
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 3. Fetch Teachers from Database
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const res = await fetch('/api/center/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    void fetchOverviewData();
    void fetchStudents();
    void fetchTeachers();
  }, []);

  useEffect(() => {
    if (activeTab === 'teachers') void fetchTeachers();
    if (activeTab === 'admissions') void fetchStudents();
    if (activeTab === 'revenue') void fetchOverviewData();
  }, [activeTab]);

  // Bulk Notification: Sabhi ko ek sath bhejna
  const handleTriggerBulkEmiAlerts = async () => {
    setDispatchingEmiAlerts(true);
    setEmiNotice({ type: '', text: '' });
    try {
      const res = await fetch('/api/center/emi-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch EMI alerts');

      setEmiNotice({
        type: 'success',
        text: `Sent notifications to ${data.dispatchedCount || 0} candidate(s) with upcoming EMI deadlines.`,
      });
      setTimeout(() => setEmiNotice({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setEmiNotice({ type: 'error', text: err.message });
    } finally {
      setDispatchingEmiAlerts(false);
    }
  };

  // Individual Notification: Sirf ek student ko bhejna
  const handleSendSingleAlert = async (studentId: string, studentName: string) => {
    setSingleSendingId(studentId);
    setEmiNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/center/emi-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch individual alert');

      setEmiNotice({
        type: 'success',
        text: `EMI alert notice sent to ${studentName}!`,
      });
      setTimeout(() => setEmiNotice({ type: '', text: '' }), 3500);
    } catch (err: any) {
      setEmiNotice({ type: 'error', text: err.message });
    } finally {
      setSingleSendingId(null);
    }
  };

  // Step A: Send OTP to official email
  const handleSendEmailOtp = async (target: 'TEACHER' | 'STUDENT') => {
    const targetEmail = target === 'TEACHER' ? teacherEmail : candidateEmail;
    if (!targetEmail || !targetEmail.includes('@')) {
      setOtpNotice({ type: 'error', text: 'Please enter a valid official email first.' });
      return;
    }

    setOtpTargetType(target);
    setOtpStage('SENDING');
    setOtpNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, roleType: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch verification code.');

      setOtpStage('ENTER_OTP');
      setOtpNotice({
        type: 'success',
        text: `6-digit verification code sent to ${targetEmail} ${data.devOtp ? `(Dev Code: ${data.devOtp})` : ''}`,
      });
    } catch (err: any) {
      setOtpStage('IDLE');
      setOtpNotice({ type: 'error', text: err.message });
    }
  };

  // Step B: Verify OTP Code
  const handleVerifyOtp = async () => {
    const targetEmail = otpTargetType === 'TEACHER' ? teacherEmail : candidateEmail;
    if (!enteredOtp || enteredOtp.length < 6) {
      setOtpNotice({ type: 'error', text: 'Enter the complete 6-digit code.' });
      return;
    }

    setIsSubmitting(true);
    setOtpNotice({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: enteredOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect verification code.');

      setOtpStage('VERIFIED');
      setOtpNotice({ type: 'success', text: 'Official email identity verified successfully!' });
    } catch (err: any) {
      setOtpNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step C: Finalize Teacher Creation in Database
  const handleFinalizeTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStage !== 'VERIFIED') {
      setOtpNotice({ type: 'error', text: 'Official email must be verified via OTP first.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/center/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherName,
          email: teacherEmail,
          password: teacherPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize faculty account.');

      setOtpNotice({ type: 'success', text: 'Teacher account generated successfully!' });
      setTeacherName('');
      setTeacherEmail('');
      setTeacherPassword('');
      setEnteredOtp('');
      setOtpStage('IDLE');
      await fetchTeachers();

      setTimeout(() => {
        setShowTeacherModal(false);
        setOtpNotice({ type: '', text: '' });
      }, 1500);
    } catch (err: any) {
      setOtpNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step D: Finalize Student Admission in Database
  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStage !== 'VERIFIED') {
      setOtpNotice({ type: 'error', text: 'Candidate official email must be verified via OTP before registering.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/center/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: candidateName,
          email: candidateEmail,
          password: candidatePassword,
          courseTitle: selectedCourse,
          totalAmount: totalFee,
          downPayment,
          teacherId: assignedTeacherId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll student.');

      setOtpNotice({ type: 'success', text: 'Student admitted with verified official identity!' });
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePassword('');
      setEnteredOtp('');
      setOtpStage('IDLE');

      await Promise.all([fetchStudents(), fetchOverviewData()]);
    } catch (err: any) {
      setOtpNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step E: Record Installment Payment & Issue Bill
  const handleRecordPayment = async (e: React.FormEvent) => {
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
        text: `Payment recorded! Receipt No. ${data.receiptNo} dispatched.`,
      });
      setPayAmount('');
      setTransactionRef('');
      await Promise.all([fetchStudents(), fetchOverviewData()]);

      setTimeout(() => {
        setSelectedStudentForPay(null);
        setPayNotice({ type: '', text: '' });
      }, 1800);
    } catch (err: any) {
      setPayNotice({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div
      className={`flex min-h-screen font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#07090E] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. ADMIN-STYLE LEFT NAVIGATION SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r flex flex-col justify-between transition-transform duration-300 ${
          isDarkMode ? 'bg-[#0B0F17] border-white/10' : 'bg-white border-slate-200'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div>
          {/* Logo Header */}
          <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <BrandLogo size={48} />
              <div>
                <h2 className={`text-xs font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Khanna Branch
                </h2>
                <span className="text-[9px] font-mono text-orange-500 font-bold tracking-wider mt-1 block">
                  VIQ-KHN-01 NODE
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-orange-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Department Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('revenue'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeTab === 'revenue'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Branch Revenue</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('admissions'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeTab === 'admissions'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Local Admissions & EMIs</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('teachers'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Faculty & Teachers</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('tasks'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes & Tasks</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Branch Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Single Sign Out */}
        <div className={`p-4 border-t space-y-2 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            <p className="text-[10px] font-mono text-slate-400 uppercase">Center Scope</p>
            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Isolated Node Active
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ACTIVE DEPARTMENT CANVAS */}
      <main className="flex-1 md:ml-64 p-6 sm:p-10 min-w-0 space-y-8">
        
        {/* Top Header */}
        <header className={`flex items-center justify-between pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`p-2.5 rounded-xl border md:hidden ${
                isDarkMode ? 'border-white/10 bg-[#0E131F] text-slate-300' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight capitalize ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'revenue' && 'Branch Revenue & Ledger'}
                {activeTab === 'admissions' && 'Local Candidate Admissions & EMIs'}
                {activeTab === 'teachers' && 'Faculty & Teaching Instructors'}
                {activeTab === 'tasks' && 'Curriculum Notes & Lab Tasks'}
                {activeTab === 'settings' && 'Branch Security & Configuration'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                VIQ Technologies — Khanna HQ Node (Isolated Scope)
              </p>
            </div>
          </div>

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
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Night Mode</span>
              </>
            )}
          </button>
        </header>

        {/* 5 DYNAMIC STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Branch Gross Fee</span>
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              ₹{realStats.totalGrossCollected.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Collected at VIQ-KHN-01</p>
          </div>

          {/* Center share */}
          <div
            className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Net Retained Share ({100 - realStats.royaltyRate}%)</span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-500">
              ₹{realStats.netRetainedShare.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Khanna Branch Profit</p>
          </div>

          {/* HQ royalty */}
          <div
            className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">HQ Royalty ({realStats.royaltyRate}%)</span>
              <CreditCard className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="text-2xl font-black text-orange-400">
              ₹{realStats.hqRoyalty.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Central VIQ Share</p>
          </div>

          <div
            className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Pending Branch EMIs</span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-amber-500">
              ₹{realStats.totalPendingEmis.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Upcoming Student Dues</p>
          </div>

          <div
            className={`p-5 rounded-2xl border space-y-3 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Active Branch Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {realStats.activeStudentsCount}
            </h3>
            <p className="text-[10px] font-mono text-slate-400">Enrolled in Database</p>
          </div>
        </div>

        {/* 3. DYNAMIC SECTION / DEPARTMENT VIEWS */}

        {/* DEPARTMENT 1: REVENUE & ESTIMATOR */}
        {activeTab === 'revenue' && (
          <div
            className={`p-6 sm:p-8 rounded-2xl border space-y-8 transition-colors ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-orange-500 font-bold tracking-wider">
                  [ MY BRANCH REVENUE & PAYOUT CALCULATOR ]
                </span>
                <h2 className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Estimate Your Center&apos;s Monthly Earnings
                </h2>
              </div>
              <span
                className={`text-[10px] font-mono px-3 py-1 rounded-full border ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                SINGLE-BRANCH SCOPE (VIQ-KHN-01)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Target Student Admissions</span>
                    <span className="text-orange-500 font-mono text-sm">{studentsCount} Students</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={studentsCount}
                    onChange={(e) => setStudentsCount(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>0 Min</span>
                    <span>150 Mid</span>
                    <span>300 Target</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Average Course Fee</span>
                    <span className="text-orange-500 font-mono text-sm">₹{avgFee.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="60000"
                    step="1000"
                    value={avgFee}
                    onChange={(e) => setAvgFee(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div
                className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
                  isDarkMode ? 'bg-[#07090E] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    My Center Net Profit ({100 - realStats.royaltyRate}% Share)
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-emerald-500 mt-1 font-mono">
                    ₹{centerNetProfit.toLocaleString('en-IN')}
                  </h3>
                </div>

                <div
                  className={`grid grid-cols-2 gap-4 pt-4 border-t text-xs ${
                    isDarkMode ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Gross</span>
                    <span className={`font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      ₹{totalGross.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">HQ Royalty ({realStats.royaltyRate}%)</span>
                    <span className="font-bold text-orange-500 font-mono">₹{hqRoyalty.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENT 2: LOCAL ADMISSIONS & OTP VERIFICATION */}
        {activeTab === 'admissions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Candidate Registration & Installment Operations
                </h3>
                <p className="text-xs text-slate-400">
                  Manage candidate verification, active installments, and billing receipts.
                </p>
              </div>

              {/* Bulk Dispatch Button */}
              <button
                type="button"
                onClick={handleTriggerBulkEmiAlerts}
                disabled={dispatchingEmiAlerts}
                className="px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-black font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {dispatchingEmiAlerts ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                <span>Send Due EMI Email Alerts</span>
              </button>
            </div>

            {emiNotice.text && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  emiNotice.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {emiNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{emiNotice.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                className={`lg:col-span-5 p-6 rounded-2xl border space-y-5 ${
                  isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 text-orange-500 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <Plus className="w-4 h-4" />
                  <span>New Branch Admission (OTP Verified)</span>
                </div>

                {otpNotice.text && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      otpNotice.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                        : 'bg-red-500/10 border border-red-500/20 text-red-500'
                    }`}
                  >
                    {otpNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{otpNotice.text}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterCandidate} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Candidate Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate Full Name"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                        isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Official Student Email *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="student@officialdomain.com"
                        value={candidateEmail}
                        disabled={otpStage === 'VERIFIED'}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 disabled:opacity-60 ${
                          isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={otpStage === 'VERIFIED' || otpStage === 'SENDING'}
                        onClick={() => handleSendEmailOtp('STUDENT')}
                        className="px-3.5 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-500 font-bold hover:bg-orange-500 hover:text-black transition cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        {otpStage === 'SENDING' ? <Loader2 className="w-4 h-4 animate-spin" /> : otpStage === 'VERIFIED' ? 'Verified ✓' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpStage === 'ENTER_OTP' && (
                    <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
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
                          className={`flex-1 px-3 py-2 rounded-lg border border-orange-500/30 font-mono tracking-widest text-center ${
                            isDarkMode ? 'bg-[#07090E] text-white' : 'bg-white text-slate-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isSubmitting}
                          className="px-4 py-2 rounded-lg bg-orange-500 text-black font-bold hover:bg-orange-400 transition"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate login password"
                      value={candidatePassword}
                      onChange={(e) => setCandidatePassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                        isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Course Option *
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 cursor-pointer ${
                        isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      {COURSES.map((course) => (
                        <option key={course} value={course} className={isDarkMode ? 'bg-[#121620]' : 'bg-white'}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                      Assign Faculty (Optional)
                    </label>
                    <select
                      value={assignedTeacherId}
                      onChange={(e) => setAssignedTeacherId(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 cursor-pointer ${
                        isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">Select Instructor...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id} className={isDarkMode ? 'bg-[#121620]' : 'bg-white'}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Total Fee (₹)</label>
                      <input
                        type="number"
                        value={totalFee}
                        onChange={(e) => setTotalFee(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border font-mono ${
                          isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Down Payment (₹)</label>
                      <input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border font-mono ${
                          isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpStage !== 'VERIFIED' || isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 transition cursor-pointer mt-2 disabled:opacity-40"
                  >
                    {isSubmitting ? 'Registering in Database...' : 'Complete Verified Admission'}
                  </button>
                </form>
              </div>

              <div
                className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
                  isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Branch Roster & Installments ({students.length})
                </h3>
                
                {loadingStudents ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-mono">Fetching database students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-xs text-slate-400">No candidates enrolled yet in this branch node.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-white/10 pb-2">
                        <tr>
                          <th className="py-2.5 px-3">Candidate & ID</th>
                          <th className="py-2.5 px-3">Paid</th>
                          <th className="py-2.5 px-3">Due</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3">
                              <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{student.fullName}</p>
                              <p className="text-[10px] font-mono text-orange-500">{student.studentCode}</p>
                            </td>
                            <td className="py-3 px-3 font-mono text-emerald-500 font-bold">
                              ₹{student.paidAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 font-mono text-orange-500 font-bold">
                              ₹{student.dueAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {student.dueAmount > 0 ? (
                                <div className="flex items-center justify-end gap-2">
                                  {/* Individual Single Alert Button */}
                                  <button
                                    type="button"
                                    title="Send single email alert to this candidate"
                                    onClick={() => handleSendSingleAlert(student.id, student.fullName)}
                                    disabled={singleSendingId === student.id}
                                    className="px-2.5 py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-black font-bold text-[11px] transition cursor-pointer flex items-center gap-1 disabled:opacity-40"
                                  >
                                    {singleSendingId === student.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <BellRing className="w-3.5 h-3.5" />
                                    )}
                                    <span>Alert</span>
                                  </button>

                                  {/* Record Pay Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedStudentForPay(student);
                                      setPayNotice({ type: '', text: '' });
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-black font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Record Pay</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] font-mono text-emerald-500 font-bold">Cleared ✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENT 3: FACULTY & TEACHERS */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Branch Teaching Faculty
                </h3>
                <p className="text-xs text-slate-400">Manage instructors assigned to this branch location.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTeacherModal(true);
                  setOtpStage('IDLE');
                  setOtpNotice({ type: '', text: '' });
                }}
                className="px-4 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs flex items-center gap-2 hover:bg-orange-400 transition cursor-pointer shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Teacher ID (OTP Verified)</span>
              </button>
            </div>

            {loadingTeachers ? (
              <div
                className={`py-16 text-center rounded-2xl border ${
                  isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-mono">Loading teachers...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div
                className={`py-16 text-center rounded-2xl border border-dashed space-y-3 ${
                  isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
                <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  No Faculty Added Yet
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &quot;Create Teacher ID&quot; to verify official email and assign instructor login credentials.
                </p>
              </div>
            ) : (
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase">
                    <tr>
                      <th className="py-3 px-6">Faculty Name</th>
                      <th className="py-3 px-6">Verified Email</th>
                      <th className="py-3 px-6">Security Clearance</th>
                      <th className="py-3 px-6">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className={`py-4 px-6 font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xs">
                            {t.name[0]}
                          </div>
                          <span>{t.name}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-400">{t.email}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            Official Verified
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 4: NOTES & TASKS */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
                isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 text-orange-500 font-mono text-[11px] font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Assign New Task / Lab Work</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Task / Assignment Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Build JWT Middleware in Express"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Program / Batch
                  </label>
                  <select
                    value={taskBatch}
                    onChange={(e) => setTaskBatch(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 cursor-pointer ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {COURSES.map((course) => (
                      <option key={course} value={course} className={isDarkMode ? 'bg-[#121620]' : 'bg-white'}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                    Submission Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (taskTitle) {
                      setTasks([
                        ...tasks,
                        {
                          id: Date.now().toString(),
                          title: taskTitle,
                          course: taskBatch,
                          due: taskDueDate || '2026-11-01',
                        },
                      ]);
                      setTaskTitle('');
                    }
                  }}
                  className="w-full py-3.5 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 transition cursor-pointer mt-2"
                >
                  Publish Assignment
                </button>
              </div>
            </div>

            <div
              className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
                isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Active Assignments & Lab Deadlines
                </h3>
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                    isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {tasks.length} Active Tasks
                </span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#121620] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-orange-500 font-bold block">
                        {task.course}
                      </span>
                      <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">Due: {task.due}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENT 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div
            className={`p-8 rounded-2xl border space-y-4 max-w-xl ${
              isDarkMode ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Branch Security & Credentials
            </h3>
            <p className="text-xs text-slate-400">
              Only authenticated faculty and students with verified official domain credentials can access the Khanna isolated branch workspace.
            </p>
          </div>
        )}
      </main>

      {/* MODAL 1: CREATE TEACHER WITH OTP VERIFICATION */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 sm:p-8 rounded-2xl border space-y-6 shadow-2xl relative ${
              isDarkMode ? 'bg-[#0B0F17] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-start justify-between border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  <span>Create Faculty ID (OTP Verified)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces official email ownership verification prior to ID generation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="text-slate-400 hover:text-orange-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {otpNotice.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  otpNotice.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {otpNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{otpNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleFinalizeTeacher} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Instructor Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Hardeep Singh"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                    isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Official Faculty Email *
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="faculty@viqtech.in"
                    value={teacherEmail}
                    disabled={otpStage === 'VERIFIED'}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 disabled:opacity-60 ${
                      isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={otpStage === 'VERIFIED' || otpStage === 'SENDING'}
                    onClick={() => handleSendEmailOtp('TEACHER')}
                    className="px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-500 font-bold hover:bg-orange-500 hover:text-black transition cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {otpStage === 'SENDING' ? <Loader2 className="w-4 h-4 animate-spin" /> : otpStage === 'VERIFIED' ? 'Verified ✓' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpStage === 'ENTER_OTP' && (
                <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
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
                      className={`flex-1 px-3 py-2 rounded-lg border border-orange-500/30 font-mono tracking-widest text-center ${
                        isDarkMode ? 'bg-[#07090E] text-white' : 'bg-white text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-black font-bold hover:bg-orange-400 transition"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Initial Login Password *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Set initial password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-orange-500/50 ${
                    isDarkMode ? 'bg-[#121620] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
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
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Generate ID</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT & ISSUE BILL */}
      {selectedStudentForPay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 sm:p-8 rounded-2xl border space-y-6 shadow-2xl relative ${
              isDarkMode ? 'bg-[#0B0F17] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-start justify-between border-b pb-4 ${
              isDarkMode ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <span>Record Pay & Issue Bill</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Candidate: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedStudentForPay.fullName}</strong> ({selectedStudentForPay.studentCode})
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

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1 ${
                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-slate-400">
                  <span>Current Due Balance:</span>
                  <span className="font-bold text-orange-500 font-mono">
                    ₹{selectedStudentForPay.dueAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                  Payment Amount to Collect (₹) *
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
                  {isSubmittingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Record & Issue Bill</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}