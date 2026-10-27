'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Globe, 
  Building2, 
  GraduationCap, 
  Trash2, 
  Pin, 
  X, 
  Loader2, 
  Send,
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';

interface CenterOption {
  id: string;
  name: string;
  centerCode: string;
}

interface CircularItem {
  id: string;
  title: string;
  content: string;
  targetRole?: string | null;
  scope?: 'ALL' | 'CENTERS' | 'STUDENTS' | 'SPECIFIC_CENTER';
  centerId?: string | null;
  center?: CenterOption | null;
  isPinned: boolean;
  priority?: 'NORMAL' | 'URGENT';
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<CircularItem[]>([]);
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'ALL' | 'CENTERS' | 'STUDENTS' | 'SPECIFIC_CENTER'>('ALL');
  const [centerId, setCenterId] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      // Try dedicated admin endpoint first, then generic fallback
      let res = await fetch('/api/admin/announcements');
      if (!res.ok) {
        res = await fetch('/api/announcements');
      }

      const data = await res.json();
      if (data.success) {
        const rawItems: any[] = data.announcements || data.circulars || [];
        setAnnouncements(
          rawItems.map((item) => ({
            ...item,
            isPinned: item.isPinned ?? item.priority === 'URGENT',
          }))
        );
        setCenters(data.centers || []);
        if (data.centers?.length > 0 && !centerId) {
          setCenterId(data.centers[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setErrorMsg('');
    setSubmitting(true);

    // Map scope to Prisma Role target
    let targetRole: string | null = null;
    if (scope === 'CENTERS') targetRole = 'CENTER_ADMIN';
    if (scope === 'STUDENTS') targetRole = 'STUDENT';

    const payload = {
      title: title.trim(),
      content: content.trim(),
      scope,
      targetRole,
      centerId: scope === 'SPECIFIC_CENTER' ? centerId : null,
      isPinned,
      priority: isPinned ? 'URGENT' : 'NORMAL',
    };

    try {
      let res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast dispatch failed');

      setTitle('');
      setContent('');
      setScope('ALL');
      setIsPinned(false);
      setIsModalOpen(false);
      await loadAnnouncements();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish circular.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to retract and delete this circular?')) return;

    setDeletingId(id);
    try {
      let res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/announcements?id=${id}`, {
          method: 'DELETE',
        });
      }
      if (res.ok) {
        await loadAnnouncements();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getScopeBadge = (c: CircularItem) => {
    const effectiveScope = c.targetRole === 'STUDENT' ? 'STUDENTS' : c.targetRole === 'CENTER_ADMIN' ? 'CENTERS' : c.centerId ? 'SPECIFIC_CENTER' : c.scope || 'ALL';

    switch (effectiveScope) {
      case 'ALL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Globe className="w-3 h-3" /> ALL ECOSYSTEM
          </span>
        );
      case 'CENTERS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> CENTERS ONLY
          </span>
        );
      case 'STUDENTS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> STUDENTS ONLY
          </span>
        );
      case 'SPECIFIC_CENTER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {c.center?.name || 'SPECIFIC BRANCH'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <Users className="w-3 h-3" /> GENERAL
          </span>
        );
    }
  };

  const pinnedCount = announcements.filter((a) => a.isPinned || a.priority === 'URGENT').length;
  const globalCount = announcements.filter((a) => !a.targetRole && !a.centerId).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 space-y-7 selection:bg-orange-500 selection:text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Official Circulars & Broadcast Console</span>
            <Sparkles className="w-5 h-5 text-orange-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Publish network-wide academic notices, operational circulars, and branch-specific memos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-orange-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Dispatch New Circular</span>
        </button>
      </div>

      {/* Snapshot KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Circulars</span>
            <Megaphone className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2 font-mono tracking-tight">{announcements.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Dispatched bulletins</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400">Network Wide</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono tracking-tight">
            {globalCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Visible across all portals</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">Pinned Directives</span>
            <Pin className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono tracking-tight">
            {pinnedCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Prioritized banners</span>
        </div>
      </div>

      {/* Circulars List Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-orange-500" />
            <span>Active Network Circular Feed</span>
          </h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700">
            {announcements.length} Published
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
            <p>Loading circular feeds...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">No circulars broadcasted yet.</p>
            <p className="text-slate-500">Click &ldquo;+ Dispatch New Circular&rdquo; to broadcast your first notification.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  item.isPinned || item.priority === 'URGENT'
                    ? 'border-amber-500/40 bg-amber-500/[0.04] shadow-sm shadow-amber-500/5'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {(item.isPinned || item.priority === 'URGENT') && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500 text-black flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-current" /> PINNED
                      </span>
                    )}
                    {getScopeBadge(item)}
                    <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 cursor-pointer disabled:opacity-50"
                      title="Delete circular"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Dispatch Circular */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-slate-100">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Dispatch Official Circular</h2>
                <p className="text-[11px] text-orange-400">Target audience and priority notice settings</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="px-6 py-2.5 bg-red-500/10 text-red-400 text-xs font-semibold border-b border-red-500/20 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Circular Subject Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fall Practical Examination Timetable"
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-semibold mb-1">
                    Target Broadcast Channel *
                  </label>
                  <select
                    value={scope}
                    onChange={(e) =>
                      setScope(
                        e.target.value as
                          | 'ALL'
                          | 'CENTERS'
                          | 'STUDENTS'
                          | 'SPECIFIC_CENTER',
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700 text-slate-200 font-semibold focus:border-orange-500 outline-none text-xs [color-scheme:dark]"
                  >
                    <option value="ALL">Entire Ecosystem (All Portals)</option>
                    <option value="CENTERS">Center Franchise Admins</option>
                    <option value="STUDENTS">All Enrolled Students</option>
                    <option value="SPECIFIC_CENTER">Single Specific Branch</option>
                  </select>
                </div>

                {scope === 'SPECIFIC_CENTER' && (
                  <div>
                    <label className="block text-slate-200 font-semibold mb-1">
                      Designated Branch *
                    </label>
                    <select
                      value={centerId}
                      onChange={(e) => setCenterId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700 text-slate-200 font-semibold focus:border-orange-500 outline-none text-xs [color-scheme:dark]"
                    >
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.centerCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">
                  Circular Directives / Body Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter detailed instructions, operational timings, guidelines, and compliance expectations..."
                  className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-xs resize-none text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded bg-slate-950 border-slate-700 cursor-pointer accent-orange-500"
                />
                <label htmlFor="pinNotice" className="text-slate-300 font-semibold cursor-pointer">
                  Pin to Top as High-Priority Notice Banner
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-orange-600/20"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submitting ? 'Broadcasting...' : 'Dispatch Circular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}