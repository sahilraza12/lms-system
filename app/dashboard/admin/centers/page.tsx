'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { 
  Building2, 
  Plus, 
  Users, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone, 
  X, 
  Loader2, 
  ShieldCheck, 
  RefreshCw,
  Search,
  AlertCircle,
  Menu,
  Lock,
  BookOpen,
  Receipt,
  Award,
  FileSpreadsheet,
  CircleDollarSign
} from 'lucide-react';

// Data contracts matching backend GET /api/admin/centers response
interface CenterUser {
  email: string;
}

interface CenterItem {
  id: string;
  name: string;
  centerCode: string;
  address: string | null;
  phone: string | null;
  user: CenterUser | null;
  _count: {
    teachers: number;
    students: number;
  };
}

export default function AdminCentersPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form State for Center Provisioning
  const [name, setName] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [royaltyRate, setRoyaltyRate] = useState(25);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Navigation menu items for Superadmin Console
  const navItems = [
    { label: 'HQ Overview & Revenue', href: '/dashboard/admin', icon: CircleDollarSign },
    { label: 'Franchise Centers', href: '/dashboard/admin/centers', icon: Building2 },
    { label: 'Master Students', href: '/dashboard/admin/students', icon: Users },
    { label: 'Curriculum & Courses', href: '/dashboard/admin/courses', icon: BookOpen },
    { label: 'Global Fee Ledger', href: '/dashboard/admin/ledger', icon: Receipt },
    { label: 'Certificate Clearance', href: '/dashboard/admin/certificates', icon: Award },
    { label: 'Audit & CSV Reports', href: '/dashboard/admin/reports', icon: FileSpreadsheet },
  ];

  // Fetch registered centers telemetry from API
  const fetchCenters = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const res = await fetch('/api/admin/centers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCenters(data.centers || []);
      } else {
        throw new Error(data.error || 'Failed to fetch regional centers.');
      }
    } catch (err: unknown) {
      console.error('Failed to load training centers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initializeCenters() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/centers', {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCenters(data.centers || []);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Failed to load centers:', err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void initializeCenters();
    return () => controller.abort();
  }, []);

  // Handle Provisioning Form Submission
  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          centerCode: centerCode.trim().toUpperCase(),
          address: address.trim(),
          phone: phone.trim(),
          royaltyRate,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision franchise branch.');
      }

      // Reset form on success
      setName('');
      setCenterCode('');
      setAddress('');
      setPhone('');
      setRoyaltyRate(25);
      setEmail('');
      setPassword('');
      setIsModalOpen(false);

      // Reload dataset
      await fetchCenters();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to provision franchise branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockSession = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // Filter centers based on search query
  const filteredCenters = centers.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.centerCode.toLowerCase().includes(query) ||
      (c.user?.email && c.user.email.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden text-slate-100 bg-[#070A0F] min-h-screen">
      
      {/* 1. Mobile Standalone Header (Ensures immediate responsive toggle even without layout fix) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0B0F17] border-b border-slate-800 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={36} />
          <div>
            <span className="font-bold text-sm text-white block leading-tight">VIQ HQ</span>
            <span className="text-[9px] font-mono text-orange-400 uppercase font-semibold">Franchise Desk</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1.5 text-xs font-bold"
        >
          <Menu className="w-4 h-4" />
          <span>MENU</span>
        </button>
      </div>

      {/* 2. Mobile Off-Canvas Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-[#0B0F17] border-r border-slate-800 p-5 flex flex-col justify-between z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-sm">Superadmin Console</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-orange-500 text-black font-bold shadow-lg shadow-orange-500/20'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLockSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-red-400 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Session</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Center Directory Body */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500 shrink-0" />
                <span>Training Centers Directory</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                {centers.length} Active Nodes
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Provision franchise branches, manage node credentials, and monitor regional candidate allocations.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => void fetchCenters(true)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition shadow-sm cursor-pointer shrink-0"
              title="Refresh Centers Registry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Provision New Center</span>
            </button>
          </div>
        </div>

        {/* Search & Overview Metrics */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by branch name, code, email, or city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2 self-end sm:self-auto">
            <span>Showing: <strong className="text-slate-200">{filteredCenters.length}</strong> of {centers.length} Centers</span>
          </div>
        </div>

        {/* Responsive Content Presentation */}
        {loading ? (
          <div className="py-20 rounded-2xl bg-[#0B0F17] border border-slate-800 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-orange-500" />
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Querying Franchise Node Registry...
            </p>
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="py-16 rounded-2xl bg-[#0B0F17] border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Franchise Centers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? 'No centers match the provided search query. Try searching with different terms.' 
                : 'No training branch has been registered yet. Click "+ Provision New Center" to deploy the first node.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Touch Cards (< 768px) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredCenters.map((c) => (
                <div 
                  key={c.id} 
                  className="p-4 rounded-2xl bg-[#0B0F17] border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{c.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                          {c.centerCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 font-mono">
                    {c.user?.email && (
                      <div className="flex items-center gap-2 text-slate-300 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{c.user.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.address || 'Address unassigned'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">FACULTY</span>
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {c._count?.teachers ?? 0} Instructors
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">ENROLLED</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {c._count?.students ?? 0} Candidates
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Structured Table (md: and above) */}
            <div className="hidden md:block rounded-2xl bg-[#0B0F17] border border-slate-800/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                      <th className="px-5 py-3.5 font-bold">Center Specification</th>
                      <th className="px-5 py-3.5 font-bold">Branch Code</th>
                      <th className="px-5 py-3.5 font-bold">Location & Contact</th>
                      <th className="px-5 py-3.5 font-bold">Assigned Faculty</th>
                      <th className="px-5 py-3.5 text-right font-bold">Enrolled Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCenters.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{c.user?.email || 'No email assigned'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 text-xs inline-block">
                            {c.centerCode}
                          </span>
                        </td>

                        <td className="px-5 py-4 max-w-xs">
                          <div className="text-slate-300 truncate flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{c.address || 'Address Not Specified'}</span>
                          </div>
                          {c.phone && (
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c._count?.teachers ?? 0} Faculty</span>
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Users className="w-3.5 h-3.5" />
                            <span>{c._count?.students ?? 0} Enrolled</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal: Provision New Branch Node */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#0B0F17] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800 my-8 text-slate-100">
              
              <div className="px-6 py-4 bg-[#070A0F] border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    <span>Provision Franchise Center</span>
                  </h2>
                  <p className="text-[11px] text-orange-400">
                    Configure branch credentials and regional administrative access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 text-red-400 px-6 py-2.5 text-xs font-semibold border-b border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateCenter} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Center Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ludhiana Regional Hub"
                      className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Center Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={centerCode}
                      onChange={(e) => setCenterCode(e.target.value)}
                      placeholder="e.g. CEN-LDH-01"
                      className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 font-mono text-slate-100 uppercase placeholder-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Branch Office Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street / Sector, City, State, PIN"
                    className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 font-mono text-slate-100 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Royalty Rate (%)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step={1}
                    value={royaltyRate}
                    onChange={(e) => setRoyaltyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    HQ royalty percentage for this center. Default is 25%.
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Branch Administrator Access Credentials
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="center.lead@viq.com"
                        className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Initial Temporary Password *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-950 border rounded-xl border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800/80 font-semibold cursor-pointer transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-md shadow-orange-600/20"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? 'Provisioning Node...' : 'Confirm Provisioning'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}