'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CENTER' | 'TEACHER' | 'STUDENT';
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();

  // Role ke mutabiq navigation links
  const navItemsByRole = {
    ADMIN: [
      { label: 'Overview', href: '/dashboard/admin' },
      { label: 'Training Centers', href: '/dashboard/admin/centers' },
      { label: 'Announcements', href: '/dashboard/admin/announcements' },
      { label: 'Fee Overviews', href: '/dashboard/admin/fees' },
    ],
    SUPER_ADMIN: [
      { label: 'Overview', href: '/dashboard/admin' },
      { label: 'Training Centers', href: '/dashboard/admin/centers' },
      { label: 'Announcements', href: '/dashboard/admin/announcements' },
      { label: 'Fee Overviews', href: '/dashboard/admin/fees' },
    ],
    CENTER: [
      { label: 'Dashboard', href: '/dashboard/center' },
      { label: 'Teachers', href: '/dashboard/center/teachers' },
      { label: 'Students', href: '/dashboard/center/students' },
      { label: 'Fee Collections', href: '/dashboard/center/fees' },
      { label: 'Notices', href: '/dashboard/center/announcements' },
    ],
    TEACHER: [
      { label: 'My Batch', href: '/dashboard/teacher' },
      { label: 'Assignments', href: '/dashboard/teacher/tasks' },
      { label: 'Attendance', href: '/dashboard/teacher/attendance' },
      { label: 'Class Circulars', href: '/dashboard/teacher/announcements' },
    ],
    STUDENT: [
      { label: 'My Learning', href: '/dashboard/student' },
      { label: 'My Assignments', href: '/dashboard/student/tasks' },
      { label: 'Fee Ledger', href: '/dashboard/student/fees' },
      { label: 'Attendance', href: '/dashboard/student/attendance' },
      { label: 'Notice Board', href: '/dashboard/student/announcements' },
    ],
  };

  const navLinks = navItemsByRole[role] || [];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="px-3 py-4 border-b border-slate-800 mb-6">
          <span className="text-xs font-black tracking-widest text-orange-500 uppercase">
            VIQ Ecosystem
          </span>
          <h1 className="text-lg font-bold text-white tracking-tight">Cloud Portal</h1>
          <div className="mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-orange-400 border border-slate-700">
            {role}
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 rounded-lg">
        <p className="text-xs text-slate-400">Logged in as</p>
        <p className="text-sm font-semibold text-slate-200 truncate">{userName}</p>
        <Link
          href="/api/auth/logout"
          className="mt-3 block text-center text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}