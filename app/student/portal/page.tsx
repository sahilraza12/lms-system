'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, Megaphone, Pin, RefreshCw } from 'lucide-react';

interface Circular {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

function isCircular(value: unknown): value is Circular {
  if (!value || typeof value !== 'object') return false;

  const circular = value as Record<string, unknown>;
  return (
    typeof circular.id === 'string' &&
    typeof circular.title === 'string' &&
    typeof circular.content === 'string' &&
    typeof circular.isPinned === 'boolean' &&
    typeof circular.createdAt === 'string' &&
    !Number.isNaN(Date.parse(circular.createdAt))
  );
}

export default function StudentPortalPage() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCirculars() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/student/announcements', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const result: unknown = await response.json();

        if (!response.ok) {
          const message =
            result && typeof result === 'object' && 'error' in result &&
            typeof result.error === 'string'
              ? result.error
              : 'Could not load the notice board. Please try again.';
          throw new Error(message);
        }

        if (
          !result ||
          typeof result !== 'object' ||
          !('success' in result) ||
          result.success !== true ||
          !('circulars' in result) ||
          !Array.isArray(result.circulars) ||
          !result.circulars.every(isCircular)
        ) {
          throw new Error('The notice board returned an invalid response.');
        }

        setCirculars(result.circulars.filter(isCircular));
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load the notice board. Please try again.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCirculars();
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <main className="viq-page min-h-screen px-4 py-8 font-sans sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-500 transition hover:text-cyan-400"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to student dashboard
        </Link>

        <section className="viq-card space-y-6 p-6 sm:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-amber-500">
                <Megaphone aria-hidden="true" className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Student updates
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Live Academic Notice Board
              </h1>
              <p className="mt-2 text-sm viq-text-secondary">
                Important circulars and updates for your student community.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              disabled={loading}
              className="viq-pill inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
          </header>

          {loading ? (
            <div
              className="flex items-center justify-center gap-3 py-12 text-sm viq-text-secondary"
              role="status"
              aria-live="polite"
            >
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Loading notices…
            </div>
          ) : error ? (
            <div
              className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/5 p-5"
              role="alert"
            >
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="viq-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Try again
              </button>
            </div>
          ) : circulars.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] p-8 text-center">
              <Megaphone
                aria-hidden="true"
                className="mx-auto mb-3 h-8 w-8 text-amber-500"
              />
              <h2 className="font-bold">No notices yet</h2>
              <p className="mt-1 text-sm viq-text-secondary">
                New academic circulars will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {circulars.map((circular) => (
                <li
                  key={circular.id}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] p-5"
                >
                  <article>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-base font-bold">{circular.title}</h2>
                      {circular.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                          <Pin aria-hidden="true" className="h-3.5 w-3.5" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 viq-text-secondary">
                      {circular.content}
                    </p>
                    <time
                      className="mt-4 block text-xs viq-text-muted"
                      dateTime={circular.createdAt}
                    >
                      {new Date(circular.createdAt).toLocaleString()}
                    </time>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
