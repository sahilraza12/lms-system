'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function Navbar() {
  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto viq-nav rounded-2xl px-5 py-3.5 flex items-center justify-between">
        
        {/* VIQ Technologies Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="viq-btn-primary w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">
            VIQ
          </div>
          <div>
            <span className="text-lg font-black tracking-tight block leading-none">
              VIQ <span style={{ color: '#f97316' }}>Technologies</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest viq-text-muted block mt-1">
              IT Solutions & Training Hub
            </span>
          </div>
        </Link>

        {/* Clean Essential Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold viq-text-secondary">
          <Link href="/#features" className="hover:opacity-75 transition">Solutions & Why Us</Link>
          <Link href="/#courses" className="hover:opacity-75 transition">Training Programs</Link>
          <Link href="/#verify" className="hover:opacity-75 transition">Verify Certificate</Link>
        </nav>

        {/* Right Controls: Day/Night Toggle + Verify + Login */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href="/verify-certificate"
            className="hidden sm:inline-flex items-center gap-1.5 viq-pill px-4 py-2 text-xs font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verify ID</span>
          </Link>

          <Link
            href="/login"
            className="viq-btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5"
          >
            <span>Portal Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </header>
  );
}