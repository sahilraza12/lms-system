'use client';

import { useEffect, useState } from 'react';
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
  AlertCircle
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
  scope: 'ALL' | 'CENTERS' | 'STUDENTS' | 'SPECIFIC_CENTER';
  centerId?: string | null;
  center?: CenterOption | null;
  isPinned: boolean;
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
  const [errorMsg, setErrorMsg] = useState('');

  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
        setCenters(data.centers || []);
        if (data.centers.length > 0 && !centerId) {
          setCenterId(data.centers[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load circulars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/announcements')
      .then((response) => response.json())
      .then((data) => {
        if (!active || !data.success) return;
        setAnnouncements(data.announcements || []);
        setCenters(data.centers || []);
        if (data.centers.length > 0) {
          setCenterId((currentId) => currentId || data.centers[0].id);
        }
      })
      .catch((err: unknown) => {
        if (active) console.error('Failed to load circulars:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          scope,
          centerId: scope === 'SPECIFIC_CENTER' ? centerId : null,
          isPinned,
        }),
      });

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

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAnnouncements();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getScopeBadge = (c: CircularItem) => {
    switch (c.scope) {
      case 'ALL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Globe className="w-3 h-3" /> ALL ECOSYSTEM
          </span>
        );
      case 'CENTERS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> CENTERS ONLY
          </span>
        );
      case 'STUDENTS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> STUDENTS ONLY
          </span>
        );
      case 'SPECIFIC_CENTER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {c.center?.name || 'SPECIFIC BRANCH'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Official Circulars & Broadcast Console</h1>
          <p className="text-sm text-slate-500">
            Publish network-wide academic notices, operational circulars, and branch-specific memos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch New Circular</span>
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Circulars</span>
            <Megaphone className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{announcements.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Dispatched bulletins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Network Wide</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2 font-mono">
            {announcements.filter((a) => a.scope === 'ALL').length}
          </p>
          <span className="text-[11px] text-blue-600 mt-1 inline-block">Visible to all accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pinned Directives</span>
            <Pin className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {announcements.filter((a) => a.isPinned).length}
          </p>
          <span className="text-[11px] text-amber-600 mt-1 inline-block">Prioritized banners</span>
        </div>
      </div>

      {/* Circulars List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Active Network Circular Feed</h2>
          <span className="text-xs font-mono text-slate-400">{announcements.length} Published</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
            Loading circular feeds...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No circulars broadcasted yet. Click &quot;+ Dispatch New Circular&quot; to create your first notification.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition space-y-3 ${
                  item.isPinned
                    ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.isPinned && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500 text-white flex items-center gap-1">
                        <Pin className="w-3 h-3" /> PINNED
                      </span>
                    )}
                    {getScopeBadge(item)}
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Delete circular"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Dispatch Circular */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Dispatch Official Circular</h2>
                <p className="text-xs text-orange-400">Target audience and priority notice settings</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="px-6 py-2.5 bg-red-50 text-red-700 text-xs font-semibold border-b border-red-100 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Circular Subject Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Practical Cloud Lab Schedule"
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
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
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white font-medium focus:ring-2 focus:ring-orange-500 outline-none text-xs"
                  >
                    <option value="ALL">Entire Ecosystem (All Portals)</option>
                    <option value="CENTERS">Center Franchise Admins</option>
                    <option value="STUDENTS">All Enrolled Students</option>
                    <option value="SPECIFIC_CENTER">Single Specific Branch</option>
                  </select>
                </div>

                {scope === 'SPECIFIC_CENTER' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Designated Branch *
                    </label>
                    <select
                      value={centerId}
                      onChange={(e) => setCenterId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 bg-white font-medium focus:ring-2 focus:ring-orange-500 outline-none text-xs"
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
                <label className="block text-slate-700 font-bold mb-1">
                  Circular Directives / Body Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter detailed instructions, operational timings, guidelines, and compliance expectations..."
                  className="w-full px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                />
                <label htmlFor="pinNotice" className="text-slate-700 font-bold cursor-pointer">
                  Pin to Top as High-Priority Notice Banner
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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