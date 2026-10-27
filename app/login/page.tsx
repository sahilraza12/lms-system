'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Lock,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

type RoleType = 'student' | 'center' | 'teacher' | 'admin';

const ROLE_CONFIG = {
  student: {
    title: 'Candidate Learning Portal',
    subtitle: 'Access your enrolled courses, study notes, tasks, and fee receipts.',
    placeholder: 'Student email or enrollment ID',
    targetRoute: '/student',
    icon: GraduationCap,
  },
  center: {
    title: 'Branch & Center Console',
    subtitle: 'Manage branch enrollments, local fee installments, and branch revenue.',
    placeholder: 'Center code or branch email',
    targetRoute: '/center',
    icon: Building2,
  },
  teacher: {
    title: 'Teacher Workspace',
    subtitle: 'Manage assigned students, attendance, and learning tasks.',
    placeholder: 'Teacher email or faculty code',
    targetRoute: '/dashboard/teacher/tasks',
    icon: Users,
  },
  admin: {
    title: 'HQ Executive Command',
    subtitle: 'Full network oversight, multi-branch revenue, and certification.',
    placeholder: 'HQ administrator email',
    targetRoute: '/admin',
    icon: ShieldCheck,
  },
} satisfies Record<
  RoleType,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    targetRoute: string;
    icon: typeof GraduationCap;
  }
>;

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleType>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const current = ROLE_CONFIG[role];
  const Icon = current.icon;

  const selectRole = (newRole: RoleType) => {
    setRole(newRole);
    setError('');
  };

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('Enter your account identifier and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanIdentifier,
          password,
          role: role.toUpperCase(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to sign in. Check your details.');
      }

      router.push(payload?.redirectUrl || current.targetRoute);
      router.refresh();
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#07090E] p-6 text-slate-100 sm:p-12 font-sans select-none">
      
      {/* Background Decorators - Completely isolated in back layer */}
      <div 
        style={{ pointerEvents: 'none' }} 
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" 
      />
      <div 
        style={{ pointerEvents: 'none' }} 
        className="pointer-events-none absolute left-1/2 top-1/4 z-0 h-[320px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" 
      />

      {/* Top Bar Navigation */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0D111A] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <Lock aria-hidden="true" className="h-3.5 w-3.5 text-emerald-500" />
          <span>SECURE ROLE-BASED SIGN IN</span>
        </div>
      </header>

      {/* Main Login Workspace Box */}
      <div className="relative z-30 mx-auto my-auto w-full max-w-md py-6" style={{ isolation: 'isolate' }}>
        <section className="space-y-6 rounded-3xl border border-white/10 bg-[#0D111A] p-7 sm:p-8 shadow-2xl backdrop-blur-md">
          
          {/* TAB SWITCHER - Direct High-Priority Event Binding */}
          <div 
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#121620] p-1.5 relative z-50"
            style={{ pointerEvents: 'auto' }}
          >
            {(['student', 'center', 'teacher', 'admin'] as const).map((option) => {
              const isActive = role === option;
              return (
                <button
                  key={option}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    selectRole(option);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    selectRole(option);
                  }}
                  className={`flex-1 rounded-xl py-2 text-center text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Dynamic Header */}
          <header className="space-y-2 text-center pt-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-inner">
              <Icon aria-hidden="true" className="h-6 w-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">{current.title}</h1>
            <p className="text-xs leading-relaxed text-slate-400 max-w-xs mx-auto">{current.subtitle}</p>
          </header>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-identifier"
                className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block"
              >
                Workspace Identifier
              </label>
              <input
                id="login-identifier"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={current.placeholder}
                className="w-full rounded-xl border border-white/10 bg-[#121620] px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-password"
                className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-4 py-3 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-orange-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-slate-200" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-medium text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-xs font-bold text-black transition hover:bg-orange-400 shadow-lg shadow-orange-500/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in as {role}</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-20 mx-auto w-full max-w-6xl text-center text-[10px] font-mono tracking-widest text-slate-600 uppercase">
        SECURE SESSION // VIQ TECHNOLOGIES
      </footer>
    </main>
  );
}