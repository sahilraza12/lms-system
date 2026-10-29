'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  label?: string;
  className?: string;
}

export default function LogoutButton({
  label = 'Sign Out',
  className = 'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer',
}: LogoutButtonProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Logout request failed (${response.status})`);
      }

      window.location.replace('/login');
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
      setError('Unable to sign out. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={`${className} disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        <span>{loading ? 'Signing out...' : label}</span>
      </button>
      {error && <p role="alert" className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}