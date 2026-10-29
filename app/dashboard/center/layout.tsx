'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  GraduationCap, 
  Building2, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const CENTER_NAV_ITEMS: NavItem[] = [
  {
    title: 'Branch Overview',
    href: '/dashboard/center',
    icon: LayoutDashboard,
  },
  {
    title: 'Candidate Roster',
    href: '/dashboard/center/students',
    icon: GraduationCap,
  },
  {
    title: 'Cashier & Fee Ledger',
    href: '/dashboard/center/fees',
    icon: CreditCard,
  },
  {
    title: 'Faculty Mentors',
    href: '/dashboard/center/teachers',
    icon: Users,
  },
];

export default function CenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout');
      localStorage.removeItem('viq-token');
      localStorage.removeItem('viq-user');
      sessionStorage.clear();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={40} />
          <span className="font-bold text-sm tracking-tight">Branch Command Console</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand & Center Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
            <BrandLogo size={48} />
            <div>
              <span className="text-sm font-bold text-white block leading-tight">Branch Directorate</span>
              <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest block font-bold">
                Franchise Portal
              </span>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="p-4 space-y-1.5 flex-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Operations & Management
            </div>

            {CENTER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </Link>
              );
            })}
          </div>

          {/* Branch Authority Note */}
          <div className="p-4 mx-4 mb-2 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-orange-400 font-mono text-[10px] font-bold uppercase">
              <Building2 className="w-3.5 h-3.5" />
              <span>Center Admin Scope</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Access limited to candidates and faculty enrolled under this regional branch code.
            </p>
          </div>
        </div>

        {/* Footer with Sign Out */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Terminating Session...' : 'Sign Out Portal'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}