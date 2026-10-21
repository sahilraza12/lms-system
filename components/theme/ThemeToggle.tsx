'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_CHANGE_EVENT = 'viq-theme-change';

function subscribeToTheme(onThemeChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
  window.addEventListener('storage', onThemeChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.removeEventListener('storage', onThemeChange);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains('dark');
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('viq-theme');
    const dark = savedTheme ? savedTheme === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    localStorage.setItem('viq-theme', nextDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextDark);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="viq-pill inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
      title={`Switch to ${isDark ? 'day' : 'night'} theme`}
      aria-label={`Switch to ${isDark ? 'day' : 'night'} theme`}
      aria-pressed={!isDark}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Day</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">Night</span>
        </>
      )}
    </button>
  );
}
