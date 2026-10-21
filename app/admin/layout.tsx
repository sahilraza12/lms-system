'use client';

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
  Sparkles 
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import ThemeToggle from '@/components/theme/ThemeToggle';

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

  return (
    <div className="viq-page min-h-screen flex font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col justify-between shrink-0 sticky top-0 h-screen transition-colors duration-300">
        
        {/* Top Brand */}
        <div className="p-6 space-y-6">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="viq-btn-primary w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] group-hover:scale-105 transition-transform">
              VIQ
            </div>
            <div>
              <span className="text-base font-black tracking-tight block">
                VIQ <span style={{ color: '#f97316' }}>HQ</span>
              </span>
              <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest block mt-0.5">
                SuperAdmin Console
              </span>
            </div>
          </Link>

          {/* Navigation */}
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
                      ? 'viq-btn-primary'
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

        {/* Bottom Status & Logout */}
        <div className="p-5 border-t border-[var(--border-color)] space-y-3">
          <div className="p-3 rounded-xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-[10px] font-mono">
              <p className="font-bold text-[var(--text-primary)]">ROOT ACCESS</p>
              <p className="viq-text-muted">Multi-Branch Control</p>
            </div>
          </div>

          <LogoutButton
            label="Lock Session"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl viq-pill hover:border-red-500/50 hover:text-red-500 text-xs font-bold transition disabled:opacity-60"
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-x-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 border-b border-[var(--border-color)] viq-nav px-8 flex items-center justify-between sticky top-0 z-20 rounded-none border-x-0 border-t-0">
          <div className="flex items-center gap-2 text-xs font-mono viq-text-muted font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>[ HQ EXECUTIVE TELEMETRY // ALL FRANCHISE NODES ]</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold">
              ● LIVE LEDGER SYNC
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 relative z-10 flex-1">{children}</main>
      </div>

    </div>
  );
}