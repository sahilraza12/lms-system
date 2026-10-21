'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-16 px-6 sm:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        
        {/* Brand */}
        <div className="space-y-3 max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="viq-btn-primary w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]">
              VIQ
            </div>
            <span className="text-lg font-black tracking-tight">
              VIQ <span style={{ color: '#f97316' }}>Technologies</span>
            </span>
          </Link>
          <p className="text-xs viq-text-secondary leading-relaxed">
            Empowering futures with technology and innovation. Providing industrial IT training and cutting-edge digital solutions.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-8 text-xs font-bold viq-text-muted">
          <Link href="#features" className="hover:text-orange-500 transition-colors">Solutions</Link>
          <Link href="#courses" className="hover:text-orange-500 transition-colors">Training Programs</Link>
          <Link href="#verify" className="hover:text-orange-500 transition-colors">Verify ID</Link>
          <Link href="/login" className="text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
            <span>Portal Login</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono viq-text-muted">
        <span>© 2026 VIQ TECHNOLOGIES. ALL RIGHTS RESERVED.</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          ISO-9001 & NSQF ALIGNED
        </span>
      </div>
    </footer>
  );
}