'use client';

import { useEffect, useState } from 'react';
import { BellRing, CalendarDays, Megaphone } from 'lucide-react';

interface CircularItem {
  id: string;
  title: string;
  content: string;
  scope: string;
  createdAt: string;
}

export default function StudentAnnouncementsPage() {
  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [loading, setLoading] = useState(true);

  // In production, student's centerId and teacherId come from session context
  const currentCenterId = 'default-center-id';
  const currentTeacherId = 'default-teacher-id';

  useEffect(() => {
    const loadCirculars = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/announcements/feed?role=STUDENT&centerId=${currentCenterId}&teacherId=${currentTeacherId}`
        );
        const data = await res.json();
        if (data.success) {
          setCirculars(data.announcements);
        }
      } catch (err) {
        console.error('Failed to load notices:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCirculars();
  }, []);

  return (
    <div className="space-y-7 text-[var(--text-primary)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500">
          <Megaphone className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
            Stay in the loop
          </p>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Student Notice Board
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Official circulars, exam schedules, and alerts from VIQ Administration and your mentor.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="viq-card rounded-2xl p-12 text-center">
            <BellRing className="mx-auto mb-3 h-6 w-6 animate-pulse text-orange-500" aria-hidden="true" />
            <p className="font-medium text-[var(--text-secondary)]">
              Checking for official updates...
            </p>
          </div>
        ) : circulars.length === 0 ? (
          <div className="viq-card rounded-2xl p-12 text-center">
            <BellRing className="mx-auto mb-3 h-6 w-6 text-[var(--text-muted)]" aria-hidden="true" />
            <p className="font-semibold text-[var(--text-primary)]">
              You are all caught up
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              No circulars have been posted at this time.
            </p>
          </div>
        ) : (
          circulars.map((notice) => (
            <div
              key={notice.id}
              className="viq-card rounded-2xl border-l-4 border-l-orange-500 p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={notice.createdAt}>
                    {new Date(notice.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notice.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </span>
                <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Official notice
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold leading-snug text-[var(--text-primary)]">
                {notice.title}
              </h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                {notice.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}