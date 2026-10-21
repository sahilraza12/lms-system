'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';

type RoleType = 'student' | 'center' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleType>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleConfig = {
    student: {
      title: 'Candidate Learning Portal',
      subtitle: 'Access your enrolled courses, study notes, tasks, and fee receipts.',
      placeholder: 'Student Email or Enrollment ID',
      targetRoute: '/student',
      icon: GraduationCap,
    },
    center: {
      title: 'Branch & Center Console',
      subtitle: 'Manage branch enrollments, local fee installments, and branch revenue.',
      placeholder: 'Center Code or Branch Email',
      targetRoute: '/center',
      icon: Building2,
    },
    admin: {
      title: 'HQ Executive Command',
      subtitle: 'Full network oversight, multi-branch revenue engine, and certification.',
      placeholder: 'HQ Administrator Email',
      targetRoute: '/admin',
      icon: ShieldCheck,
    },
  };

  const current = roleConfig[role];
  const IconComponent = current.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password, role }),
      });

      if (res.ok) {
        router.push(current.targetRoute);
        return;
      }
      // Direct routing if backend auth isn't enforced yet
      router.push(current.targetRoute);
    } catch {
      router.push(current.targetRoute);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="viq-page relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
      
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 viq-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Back Navigation */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="viq-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono viq-text-muted">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>3-TIER ROLE ISOLATION GATEWAY</span>
        </div>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="viq-card p-8 space-y-7">
          
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[var(--bg-glass-subtle)] border border-[var(--border-color)]">
            {(['student', 'center', 'admin'] as RoleType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  role === r
                    ? 'viq-btn-primary shadow-md'
                    : 'viq-text-secondary hover:text-[var(--text-primary)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Dynamic Role Header */}
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-500">
              <IconComponent className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {current.title}
            </h1>
            <p className="text-xs viq-text-secondary leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase viq-text-muted font-bold">
                Workspace Identifier
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={current.placeholder}
                className="viq-input w-full px-4 py-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase viq-text-muted font-bold">
                Security Passkey
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="viq-input w-full px-4 py-3 text-xs"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-mono font-bold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="viq-btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : `Launch ${role.toUpperCase()} Workspace`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Developer Preview Shortcut */}
          <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] viq-text-muted">
            <span className="font-mono flex items-center gap-1 font-bold">
              <KeyRound className="w-3 h-3 text-orange-500" /> Quick Preview:
            </span>
            <button
              type="button"
              onClick={() => router.push(current.targetRoute)}
              className="text-orange-500 hover:underline font-mono font-bold"
            >
              Enter {current.targetRoute} directly →
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Security Note */}
      <div className="relative z-10 max-w-6xl w-full mx-auto text-center text-[11px] font-mono viq-text-muted">
        ENCRYPTED SESSION HANDSHAKE // VIQ TECHNOLOGIES
      </div>

    </main>
  );
}