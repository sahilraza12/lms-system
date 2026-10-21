'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, Search, Filter, Award, Receipt } from 'lucide-react';
import Link from 'next/link';

interface MasterStudent {
  id: string;
  name: string;
  enrollmentNo: string;
  email: string;
  courseName: string;
  branchName: string;
  status: string;
}

const INITIAL_STUDENTS: MasterStudent[] = [
  {
    id: 'st-101',
    name: 'Aarav Verma',
    enrollmentNo: 'VIQ-2026-101',
    email: 'aarav.v@viqtech.in',
    courseName: 'Full-Stack Web Development (MERN)',
    branchName: 'VIQ Technologies - Khanna HQ',
    status: 'ACTIVE',
  },
  {
    id: 'st-102',
    name: 'Priya Sharma',
    enrollmentNo: 'VIQ-2026-102',
    email: 'priya.s@viqtech.in',
    courseName: 'Cybersecurity & Ethical Hacking',
    branchName: 'VIQ Technologies - Ludhiana',
    status: 'ACTIVE',
  },
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<MasterStudent[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // New Student Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [courseName, setCourseName] = useState('Full-Stack Web Development (MERN)');
  const [branchName, setBranchName] = useState('VIQ Technologies - Khanna HQ');

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.students || [];
          if (list.length > 0) {
            const mapped = list.map((s: any, idx: number) => ({
              id: s.id || `st-${idx}`,
              name: s.name || 'Candidate',
              enrollmentNo: s.enrollmentNo || `VIQ-2026-${100 + idx}`,
              email: s.email || 'student@viqtech.in',
              courseName: s.course?.name || s.courseName || 'Full-Stack Web Development (MERN)',
              branchName: s.center?.name || s.branchName || 'VIQ Technologies - Khanna HQ',
              status: s.status || 'ACTIVE',
            }));
            setStudents(mapped);
          }
        }
      } catch {}
    }
    loadStudents();
  }, []);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newEntry: MasterStudent = {
      id: `st-${Date.now()}`,
      name,
      enrollmentNo: `VIQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      email,
      courseName,
      branchName,
      status: 'ACTIVE',
    };

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
    } catch {}

    setStudents([newEntry, ...students]);
    setName('');
    setEmail('');
    setShowModal(false);
  };

  const uniqueBranches = Array.from(new Set(students.map((s) => s.branchName)));
  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(search.toLowerCase()) ||
      s.courseName.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || s.branchName === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Master Candidate Roster
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Central directory of all enrolled candidates across every VIQ branch.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="viq-btn-primary inline-flex items-center gap-2 px-5 py-3 text-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Enroll Candidate</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or course..."
            className="viq-input w-full pl-10 pr-4 py-2.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 viq-pill px-3.5 py-2">
          <Filter className="w-3.5 h-3.5 text-orange-500" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">All Branches ({students.length})</option>
            {uniqueBranches.map((b) => (
              <option key={b} value={b} className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="viq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                <th className="py-3.5 px-6 font-bold">Candidate & ID</th>
                <th className="py-3.5 px-6 font-bold">Email</th>
                <th className="py-3.5 px-6 font-bold">Enrolled Program</th>
                <th className="py-3.5 px-6 font-bold">Branch Node</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                <th className="py-3.5 px-6 text-right font-bold">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                  <td className="py-4 px-6 font-bold">
                    {st.name}
                    <span className="block text-[10px] font-mono text-orange-500 mt-0.5">{st.enrollmentNo}</span>
                  </td>
                  <td className="py-4 px-6 viq-text-secondary font-mono font-medium">{st.email}</td>
                  <td className="py-4 px-6 font-semibold">{st.courseName}</td>
                  <td className="py-4 px-6 viq-text-secondary font-medium">{st.branchName}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                      {st.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link
                      href={`/receipt/${st.id}`}
                      className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] hover:text-orange-500"
                    >
                      <Receipt className="w-3 h-3 text-orange-500" /> Receipt
                    </Link>
                    <Link
                      href={`/certificate/${st.enrollmentNo}`}
                      className="inline-flex items-center gap-1 viq-pill px-2.5 py-1.5 font-mono text-[10px] hover:text-emerald-500"
                    >
                      <Award className="w-3 h-3 text-emerald-500" /> Cert
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="viq-card bg-[var(--bg-primary)] max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black">Enroll New Candidate</h3>
              <p className="text-xs viq-text-secondary">Assign student to a branch and technical program.</p>
            </div>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sahil Raza"
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@viqtech.in"
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Program</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Assign Branch</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="viq-input w-full px-4 py-3 text-xs"
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
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}