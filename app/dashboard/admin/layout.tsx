'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  BookOpen,
  Receipt,
  Award,
  FileSpreadsheet,
  Lock,
  Menu,
  X,
  CircleDollarSign,
  ChevronRight,
  Megaphone,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const handleLockSession = async () => {
    try {
      setIsLocking(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    { label: 'HQ Overview & Revenue', href: '/dashboard/admin', icon: CircleDollarSign },
    { label: 'Franchise Centers', href: '/dashboard/admin/centers', icon: Building2 },
    { label: 'Master Students', href: '/dashboard/admin/students', icon: Users },
    { label: 'Curriculum & Courses', href: '/dashboard/admin/courses', icon: BookOpen },
    { label: 'Global Fee Ledger', href: '/dashboard/admin/ledger', icon: Receipt },
    { label: 'Official Circulars', href: '/dashboard/admin/announcements', icon: Megaphone },
    { label: 'Certificate Clearance', href: '/dashboard/admin/certificates', icon: Award },
    { label: 'Audit & CSV Reports', href: '/dashboard/admin/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-orange-500 selection:text-white">
      
      {/* 1. Mobile Sticky Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0D111A]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-black font-black text-xs flex items-center justify-center shadow-md shadow-orange-500/20">
            VIQ
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block">VIQ HQ</span>
            <span className="text-[9px] font-mono text-orange-400 font-bold tracking-widest block uppercase">
              Superadmin Console
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-orange-400 hover:text-orange-300 transition cursor-pointer"
          aria-label="Open Navigation Console"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Mobile Backdrop Overlay */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      {/* 3. Left Navigation: Off-Canvas on Mobile, Sticky Column on Desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0D111A] border-r border-white/10 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen shrink-0 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-black font-black text-sm flex items-center justify-center shadow-lg shadow-orange-500/25">
                VIQ
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-white block">VIQ HQ</span>
                <span className="text-[10px] font-mono text-orange-400 font-bold tracking-widest block uppercase">
                  SUPERADMIN CONSOLE
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links with Prefix Match */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard/admin'
                  ? pathname === '/dashboard/admin'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-black font-bold shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black stroke-[2.5]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3] shrink-0" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Account & Lock Session */}
        <div className="p-4 border-t border-white/10 space-y-2.5 bg-[#0A0D15]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-slate-200">ROOT ACCESS</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">Multi-Branch Ecosystem</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLocking}
            onClick={handleLockSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            {isLocking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{isLocking ? 'Terminating...' : 'Lock Session'}</span>
          </button>
        </div>
      </aside>

      {/* 4. Main Page Viewport Container */}
      <main className="flex-1 min-w-0 flex flex-col w-full overflow-y-auto">
        {children}
      </main>

    </div>
  );
}