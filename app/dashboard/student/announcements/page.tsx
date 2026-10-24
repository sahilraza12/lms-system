'use client';

import { useEffect, useState } from 'react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Student Notice Board</h1>
        <p className="text-sm text-slate-500">
          Official circulars, exam schedules, and alerts issued by VIQ Administration and your Mentor.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Checking for official updates...
          </div>
        ) : circulars.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No circulars posted at this time.
          </div>
        ) : (
          circulars.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm border-l-4 border-l-orange-500"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {new Date(notice.createdAt).toLocaleDateString()} at{' '}
                  {new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  Official Notice
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{notice.title}</h2>
              <div className="text-sm text-slate-700 mt-3 whitespace-pre-line leading-relaxed">
                {notice.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}