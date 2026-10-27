'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  BookOpen, 
  ExternalLink,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface StudentItem {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  user?: { email: string };
  course?: { title: string };
}

type StatusType = 'PRESENT' | 'ABSENT' | 'LATE';

function TeacherBatchContent() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StatusType>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchBatchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/students');
        const data = await res.json();
        
        if (data.success && data.students) {
          setStudents(data.students);
          // Default all students to PRESENT
          const initialMap: Record<string, StatusType> = {};
          data.students.forEach((s: StudentItem) => {
            initialMap[s.id] = 'PRESENT';
          });
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        console.error('Failed to load batch students:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchBatchStudents();
  }, []);

  const handleStatusChange = (studentId: string, status: StatusType) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: StatusType) => {
    const updated: Record<string, StatusType> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveMessage(null);

    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit attendance');

      setSaveMessage({ type: 'success', text: `Attendance for ${selectedDate} saved successfully!` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: unknown) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit attendance',
      });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;

  return (
    <div className="teacher-portal-theme min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 space-y-7 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Faculty Cohort & Attendance Register</span>
            <Sparkles className="w-5 h-5 text-orange-400" />
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor assigned students, verify roll call, and sync daily class participation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard/teacher/tasks"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 border border-slate-800 shadow-md hover:border-slate-700"
          >
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span>Manage Coursework Tasks</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">Total Enrolled</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2 font-mono tracking-tight">{students.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Assigned Students</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">Marked Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono tracking-tight">{presentCount}</p>
          <span className="text-[11px] text-emerald-400/80 mt-1 inline-block">Ready for session</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-400">Marked Absent</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-black text-red-400 mt-2 font-mono tracking-tight">{absentCount}</p>
          <span className="text-[11px] text-red-400/80 mt-1 inline-block">Requires follow-up</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono tracking-tight">{lateCount}</p>
          <span className="text-[11px] text-amber-400/80 mt-1 inline-block">Delayed entry</span>
        </div>
      </div>

      {/* Attendance Register Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Action Bar */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
              <CalendarCheck className="w-4 h-4 text-orange-400" />
              <span>Session Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-mono bg-transparent outline-none cursor-pointer text-white [color-scheme:dark]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition cursor-pointer"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {saveMessage && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-lg ${
                  saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {saveMessage.text}
              </span>
            )}

            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50 shadow-md shadow-orange-600/20 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Syncing...' : 'Save Register'}</span>
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="px-6 py-4">Student Profile</th>
                <th className="px-6 py-4">Roll Code</th>
                <th className="px-6 py-4">Course Track</th>
                <th className="px-6 py-4 text-center">Participation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                    Loading assigned cohort students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No students currently mapped to your cohort.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const currentStatus = attendanceMap[student.id] || 'PRESENT';

                  return (
                    <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{student.fullName}</div>
                        <div className="text-xs text-slate-400">{student.user?.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-orange-400 text-xs">
                        {student.studentCode}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                        {student.course?.title || 'Certification Track'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                          {(['PRESENT', 'LATE', 'ABSENT'] as StatusType[]).map((status) => {
                            const isSelected = currentStatus === status;
                            let activeClass = 'bg-slate-800 text-slate-400';
                            if (isSelected) {
                              if (status === 'PRESENT') activeClass = 'bg-emerald-600 text-white font-black shadow-md';
                              if (status === 'LATE') activeClass = 'bg-amber-500 text-white font-black shadow-md';
                              if (status === 'ABSENT') activeClass = 'bg-red-600 text-white font-black shadow-md';
                            }

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer ${
                                  isSelected ? activeClass : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
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
    </div>
  );
}

export default function TeacherBatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <TeacherBatchContent />
    </Suspense>
  );
}