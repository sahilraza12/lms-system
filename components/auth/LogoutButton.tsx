'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  label?: string;
  className: string;
}

export default function LogoutButton({
  label = 'Sign Out',
  className,
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
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={className}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{loading ? 'Signing out...' : label}</span>
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
