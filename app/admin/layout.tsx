'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  Wallet, 
  Award, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';
import BrandLogo from '@/components/brand/BrandLogo';

const navItems = [
  { name: 'HQ Overview & Revenue', href: '/admin', icon: LayoutDashboard },
  { name: 'Franchise Centers', href: '/admin/centers', icon: Building2 },
  { name: 'Master Students', href: '/admin/students', icon: Users },
  { name: 'Curriculum & Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Global Fee Ledger', href: '/admin/fees', icon: Wallet },
  { name: 'Certificate Clearance', href: '/admin/certificates', icon: Award },
  { name: 'Audit & CSV Reports', href: '/admin/reports', icon: FileSpreadsheet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer automatically when navigating between pages
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="viq-page min-h-screen font-sans selection:bg-orange-500 selection:text-white relative">
      
      {/* 1. Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* 2. Responsive Sidebar Drawer (Off-canvas on mobile, fixed on desktop) */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Top: Logo & Navigation */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <BrandLogo size={40} className="group-hover:scale-105 transition-transform" />
              <div>
                <span className="text-base font-black tracking-tight block">
                  VIQ <span style={{ color: '#f97316' }}>HQ</span>
                </span>
                <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest block mt-0.5">
                  SuperAdmin Console
                </span>
              </div>
            </Link>

            {/* Close button for mobile screen only */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'viq-btn-primary shadow-sm'
                      : 'viq-text-secondary hover:bg-[var(--bg-glass-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Strictly pinned to the bottom */}
        <div className="p-5 border-t border-[var(--border-color)] space-y-3 shrink-0 bg-[var(--bg-secondary)]">
          <div className="p-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-[10px] font-mono">
              <p className="font-bold text-[var(--text-primary)]">ROOT ACCESS</p>
              <p className="viq-text-muted">Multi-Branch Control</p>
            </div>
          </div>

          <LogoutButton
            label="Lock Session"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl viq-pill hover:border-red-500/50 hover:text-red-500 text-xs font-bold transition disabled:opacity-60 cursor-pointer"
          />
        </div>

      </aside>

      {/* 3. Main Content Area (pl-0 on mobile, lg:pl-64 on desktop) */}
      <div className="pl-0 lg:pl-64 flex flex-col min-h-screen w-full relative overflow-x-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Top Header with Hamburger for Mobile */}
        <header className="h-16 border-b border-[var(--border-color)] viq-nav px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 rounded-none border-x-0 border-t-0">
          
          <div className="flex items-center gap-3">
            {/* Hamburger Button: Shows only on mobile viewports (< 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] text-orange-500 hover:text-orange-400"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono viq-text-muted font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                [ HQ EXECUTIVE TELEMETRY // ALL FRANCHISE NODES ]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold">
              ● LIVE LEDGER SYNC
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 relative z-10 flex-1 w-full min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
}