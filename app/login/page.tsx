'use client';

import { useState } from 'react';
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

function getErrorMessage(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error;
  }
  return null;
}

function getRedirectRoute(
  payload: unknown,
  fallback: string,
  role: RoleType,
): string {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('redirectUrl' in payload) ||
    typeof payload.redirectUrl !== 'string'
  ) {
    return fallback;
  }

  const redirectUrl = payload.redirectUrl;
  const roleRedirects: Record<RoleType, string[]> = {
    student: ['/student'],
    center: ['/center'],
    teacher: ['/dashboard/teacher'],
    admin: ['/admin'],
  };
  return roleRedirects[role].some(
    (route) => redirectUrl === route || redirectUrl.startsWith(`${route}/`),
  )
    ? redirectUrl
    : fallback;
}

function getRequestedRedirect(role: RoleType): string | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('redirect');
  if (!requested) return null;

  const target = new URL(requested, window.location.origin);
  if (target.origin !== window.location.origin) return null;

  const allowedPrefixes: Record<RoleType, string[]> = {
    student: ['/student', '/dashboard/student'],
    center: ['/center', '/dashboard/center'],
    teacher: ['/teacher', '/dashboard/teacher'],
    admin: ['/admin', '/dashboard/admin'],
  };
  const allowed = allowedPrefixes[role].some(
    (prefix) =>
      target.pathname === prefix || target.pathname.startsWith(`${prefix}/`),
  );

  return allowed ? `${target.pathname}${target.search}${target.hash}` : null;
}

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

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload) || 'Unable to sign in. Check your details and try again.',
        );
      }

      if (
        !payload ||
        typeof payload !== 'object' ||
        !('success' in payload) ||
        payload.success !== true
      ) {
        throw new Error('The server returned an invalid sign-in response.');
      }

      router.replace(
        getRequestedRedirect(role) ||
          getRedirectRoute(payload, current.targetRoute, role),
      );
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="viq-page relative flex min-h-screen w-full flex-col justify-between overflow-hidden p-6 sm:p-12">
      <div className="pointer-events-none absolute inset-0 viq-grid-bg opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="viq-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono viq-text-muted">
          <Lock aria-hidden="true" className="h-3.5 w-3.5 text-emerald-500" />
          <span>SECURE ROLE-BASED SIGN IN</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-md py-8">
        <section className="viq-card space-y-7 p-8">
          <div
            className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] p-1.5 sm:grid-cols-4"
            aria-label="Choose account type"
          >
            {(['student', 'center', 'teacher', 'admin'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={role === option}
                onClick={() => {
                  setRole(option);
                  setError('');
                }}
                className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  role === option
                    ? 'viq-btn-primary shadow-md'
                    : 'viq-text-secondary hover:text-[var(--text-primary)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <header className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500">
              <Icon aria-hidden="true" className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{current.title}</h1>
            <p className="text-xs leading-relaxed viq-text-secondary">{current.subtitle}</p>
          </header>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier"
                className="text-[11px] font-mono font-bold uppercase viq-text-muted"
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
                className="viq-input w-full px-4 py-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-[11px] font-mono font-bold uppercase viq-text-muted"
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
                  className="viq-input w-full px-4 py-3 pr-11 text-xs"
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
              <p className="text-sm font-medium text-red-500" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="viq-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-xs disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Signing in…' : `Sign in as ${role}`}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl text-center text-[11px] font-mono viq-text-muted">
        SECURE SESSION // VIQ TECHNOLOGIES
      </div>
    </main>
  );
}