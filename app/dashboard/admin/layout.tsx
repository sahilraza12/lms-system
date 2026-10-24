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
} from 'lucide-react';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const handleLockSession = async () => {
    try {
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
    { label: 'Certificate Clearance', href: '/dashboard/admin/certificates', icon: Award },
    { label: 'Audit & CSV Reports', href: '/dashboard/admin/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-orange-500 selection:text-white">
      
      {/* 1. Single Mobile Sticky Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 w-full">
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
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 hover:text-orange-300 transition cursor-pointer"
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

      {/* 3. Left Navigation: Off-Canvas on Mobile, Fixed Column on Desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B0F17] border-r border-slate-800 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 shrink-0 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
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

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-black font-bold shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
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

        <div className="p-4 border-t border-slate-800/80 space-y-2.5 bg-[#080B11]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="font-bold text-slate-200">ROOT ACCESS</p>
              <p className="text-[10px] text-slate-500 font-mono">Multi-Branch Control</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLockSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-bold transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Session</span>
          </button>
        </div>
      </aside>

      {/* 4. Main Page Viewport Container */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto w-full">
        {children}
      </div>

    </div>
  );
}