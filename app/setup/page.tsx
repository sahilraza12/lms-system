'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function OneTimeSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [setupAllowed, setSetupAllowed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check karein ki pehle se admin hai ya nahi
    fetch('/api/auth/setup-admin')
      .then((res) => res.json())
      .then((data) => {
        setSetupAllowed(data.setupAllowed);
      })
      .catch(() => setSetupAllowed(false))
      .finally(() => setChecking(false));
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize');

      // Admin create hote hi login screen par bhej do
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Agar admin already create ho chuka hai toh yeh message dikhayega aur form nahi aayega
  if (!setupAllowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <Lock className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-white">Setup Locked</h2>
          <p className="text-sm text-slate-400">
            System initialization is complete. Root administrator account already exists.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto text-orange-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">HQ System Initialization</h1>
          <p className="text-xs text-slate-400">
            Create the primary root SuperAdmin. This form will permanently close once completed.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Root Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@viqtech.in"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Security Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? 'Initializing System...' : 'Create Root Admin & Lock'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}