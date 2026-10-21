'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
}

interface Note {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface StudentData {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string;
  gender: string;
  center: { name: string; phone: string };
  course: {
    title: string;
    duration: string;
    description: string;
    notes?: Note[];
    tasks?: Task[];
  };
  feePlan: {
    type: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    installments: Installment[];
  } | null;
  certificates: {
    id: string;
    certNumber: string;
    certType: string;
    status: string;
  }[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState('Company Certificate');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/profile');
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('/api/student/profile');
        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleRequestCertificate = async () => {
    setRequesting(true);
    try {
      const res = await fetch('/api/student/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certType: selectedCertType }),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to submit request');
      } else {
        alert('Certificate request submitted successfully!');
        fetchProfile();
      }
    } catch {
      alert('Error requesting certificate');
    } finally {
      setRequesting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading student dashboard...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4">
        <p className="text-lg">No student profile linked to this account.</p>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-white"
        >
          Return to Login
        </button>
      </div>
    );
  }

  const fee = student.feePlan;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Student Learning Portal</h1>
          <p className="text-xs text-slate-400">
            Center: <span className="text-indigo-400">{student.center?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-indigo-300">
            {student.studentCode}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Card & Course Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-900/50 p-6 rounded-xl">
            <span className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">
              Enrolled Course
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">{student.course?.title}</h2>
            <p className="text-sm text-slate-400 mt-2">
              Duration: {student.course?.duration} • Candidate: {student.fullName}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Overall Fee Status</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  ₹{fee?.paidAmount || 0}
                </span>
                <span className="text-sm text-slate-400">/ ₹{fee?.totalAmount || 0}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Balance: ₹{fee?.balance || 0}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  fee?.status === 'PAID'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {fee?.status || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Study Materials & Assignments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-1">Study Materials & Notes</h3>
            <p className="text-xs text-slate-400 mb-4">Download resource materials provided for your modules</p>
            
            {!student.course?.notes || student.course.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes published for this course yet.</p>
            ) : (
              <div className="space-y-3">
                {student.course.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{note.title}</p>
                      <p className="text-xs text-slate-400">{note.description || 'Reference document'}</p>
                    </div>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs font-medium transition"
                    >
                      View / Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-1">Assignments & Tasks</h3>
            <p className="text-xs text-slate-400 mb-4">Complete submissions before deadline</p>

            {!student.course?.tasks || student.course.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No pending assignments assigned.</p>
            ) : (
              <div className="space-y-3">
                {student.course.tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EMI & Installments Breakdown */}
        {fee?.installments && fee.installments.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">EMI & Installment Schedule</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pay installments on time at your training center</p>
              </div>
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                {fee.installments.length} Installments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Installment</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fee.installments.map((inst, index) => (
                    <tr key={inst.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-white">Installment #{index + 1}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-indigo-300">
                        ₹{inst.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            inst.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificates Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Course Certificates</h3>
              <p className="text-xs text-slate-400">Official accreditation requests and validation</p>
            </div>

            {fee && fee.balance === 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCertType}
                  onChange={(e) => setSelectedCertType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="Company Certificate">Company Certificate</option>
                  <option value="Skill India / NSQF">Skill India / NSQF</option>
                  <option value="International">International Certificate</option>
                </select>
                <button
                  onClick={handleRequestCertificate}
                  disabled={requesting}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {requesting ? 'Submitting...' : 'Request Certificate'}
                </button>
              </div>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20">
                Clear pending fee balance (₹{fee?.balance || 0}) to request certificate
              </span>
            )}
          </div>

          {student.certificates.length === 0 ? (
            <p className="text-sm text-slate-500">
              No certificates requested yet. Select certification type and request once fee is cleared.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.certificates.map((cert) => (
                <div key={cert.id} className="border border-slate-800 p-4 rounded-lg bg-slate-950/50">
                  <p className="text-xs text-indigo-400 font-mono">{cert.certNumber}</p>
                  <p className="text-sm font-semibold text-white mt-1">{cert.certType}</p>
                  <span
                    className={`text-xs mt-2 inline-block px-2 py-0.5 rounded font-medium ${
                      cert.status === 'ISSUED'
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                        : cert.status === 'REJECTED'
                        ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                    }`}
                  >
                    Status: {cert.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}