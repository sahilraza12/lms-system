'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Plus, 
  X, 
  MapPin, 
  Mail, 
  KeyRound, 
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Search,
  ArrowRight,
  AlertCircle,
  Clock
} from 'lucide-react';

// Domain model for franchise center representation
interface FranchiseCenter {
  id: string;
  name: string;
  code: string;
  city: string;
  managerName: string;
  managerEmail: string;
  studentsCount: number;
  revenue: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function FranchiseCentersPage() {
  // Initialize with an empty array to eliminate state flickering on initial load
  const [centers, setCenters] = useState<FranchiseCenter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal Workflow State: 'FORM' | 'OTP'
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<'FORM' | 'OTP'>('FORM');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Branch & Manager Form State
  const [centerName, setCenterName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [branchCode, setBranchCode] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  const [managerEmail, setManagerEmail] = useState<string>('');
  const [managerPassword, setManagerPassword] = useState<string>('');
  const [royaltyRate, setRoyaltyRate] = useState<number>(25);

  // OTP Verification State
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(60);

  // Fetch registered centers telemetry from database
  const loadCenters = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/admin/centers', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.centers)) {
          const mapped: FranchiseCenter[] = json.centers.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.centerCode,
            city: c.address || 'Active Node',
            managerName: c.user?.fullName || 'Assigned Lead',
            managerEmail: c.user?.email || 'N/A',
            studentsCount: c._count?.students || 0,
            revenue: c.totalCollected || 0,
            status: 'ACTIVE',
          }));
          setCenters(mapped);
        }
      }
    } catch (err) {
      console.warn('Center telemetry query failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCenters();
  }, [loadCenters]);

  // Handle OTP Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modalStep === 'OTP' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalStep, otpTimer]);

  // Step 1: Pre-flight validation & Dispatch OTP to Official Mailbox
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Security validation: Enforce minimum 8 characters for passkey
    if (managerPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/centers/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: managerEmail.trim().toLowerCase(),
          centerCode: branchCode.trim().toUpperCase(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to dispatch verification code.');
      }

      // Transition to OTP verification step
      setModalStep('OTP');
      setOtpTimer(60);
      setOtpCode('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error requesting authorization code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP and complete center registration
  const handleVerifyAndProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please input a valid 6-digit verification code.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: centerName.trim(),
          centerCode: branchCode.trim().toUpperCase(),
          address: city.trim(),
          email: managerEmail.trim().toLowerCase(),
          password: managerPassword,
          managerName: managerName.trim(),
          royaltyRate,
          otp: otpCode.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Center authentication or provisioning failed.');
      }

      handleCloseModal();
      await loadCenters();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Node provisioning failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset modal state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStep('FORM');
    setErrorMsg('');
    setCenterName('');
    setCity('');
    setBranchCode('');
    setManagerName('');
    setManagerEmail('');
    setManagerPassword('');
    setRoyaltyRate(25);
    setOtpCode('');
  };

  // Remove center
  const handleDeleteCenter = (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to deactivate and remove this partner center?');
    if (confirmDelete) {
      setCenters((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Client-side search filtering
  const filteredCenters = centers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.managerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 font-sans w-full min-w-0">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Franchise Centers Management</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {loading ? '...' : `${centers.length} Regional Nodes`}
            </span>
          </h1>
          <p className="text-xs sm:text-sm viq-text-secondary mt-1">
            Register new partner nodes, authenticate branch incharge access, and monitor regional capacity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadCenters(true)}
            className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass-subtle)] hover:bg-[var(--bg-secondary)] text-slate-300 transition cursor-pointer"
            title="Refresh Nodes"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="viq-btn-primary px-5 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20 font-bold"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register New Center</span>
          </button>
        </div>
      </div>

      {/* 2. Instant Search Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter centers by name, code, manager email, or city..."
            className="viq-input w-full pl-9 pr-4 py-2.5 text-xs"
          />
        </div>
        <div className="text-xs font-mono viq-text-muted">
          Showing <strong>{filteredCenters.length}</strong> of {centers.length} Centers
        </div>
      </div>

      {/* 3. Center Cards Grid & Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((placeholder) => (
            <div
              key={placeholder}
              className="viq-card p-6 space-y-5 bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] rounded-2xl animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-20" />
                <div className="h-4 bg-slate-800 rounded w-16" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/3" />
              </div>
              <div className="h-16 bg-slate-800/60 rounded-xl" />
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-color)]">
                <div className="h-8 bg-slate-800 rounded" />
                <div className="h-8 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="text-center py-16 viq-card border border-dashed border-[var(--border-color)] rounded-2xl space-y-2">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">No Franchise Centers Found</p>
          <p className="text-xs viq-text-muted">
            {searchQuery
              ? 'No centers matched your search query.'
              : 'Register a new partner center to start tracking.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="viq-card p-6 space-y-5 bg-[var(--bg-glass-subtle)] border border-[var(--border-color)] hover:border-orange-500/40 transition-all shadow-md relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="viq-pill px-3 py-1 font-mono text-[10px] font-bold text-orange-500 border-orange-500/20">
                  {center.code}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{center.status}</span>
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black leading-snug">{center.name}</h3>
                <p className="text-xs viq-text-muted flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>{center.city} Node</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1 text-xs">
                <span className="text-[9px] font-mono uppercase viq-text-muted font-bold block tracking-wider">
                  Assigned Branch Manager
                </span>
                <p className="font-bold text-slate-200">{center.managerName}</p>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 truncate pt-0.5">
                  <Mail className="w-3 h-3 text-orange-400 shrink-0" />
                  <span className="truncate">{center.managerEmail}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-color)] text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Candidates</span>
                  <p className="text-lg font-black font-mono mt-0.5">{center.studentsCount}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase viq-text-muted block font-bold">Ledger Revenue</span>
                  <p className="text-lg font-black font-mono text-emerald-500 mt-0.5">
                    ₹{center.revenue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteCenter(center.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                  title="Deactivate Center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Modal: Two-Factor Email OTP Registration */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="viq-card bg-[var(--bg-primary)] max-w-lg w-full p-6 sm:p-8 space-y-6 my-auto shadow-2xl border border-[var(--border-color)] relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-black">
                    {modalStep === 'FORM' ? 'Register Partner Branch' : 'Authenticate Manager Email'}
                  </h3>
                </div>
                <p className="text-xs viq-text-secondary mt-1">
                  {modalStep === 'FORM'
                    ? 'Setup franchise details and dispatch a verification OTP to the official lead.'
                    : `Input the 6-digit authentication token transmitted to ${managerEmail}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-white/10 viq-text-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Prompt */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Branch Details & Manager Credentials Form */}
            {modalStep === 'FORM' && (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Center / Institute Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. VIQ Technologies - Jalandhar Node"
                    className="viq-input w-full px-4 py-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                      City / Region *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Jalandhar"
                      className="viq-input w-full px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                      Branch Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="e.g. VIQ-JAL-04"
                      className="viq-input w-full px-4 py-2.5 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                    Royalty Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step={1}
                    value={royaltyRate}
                    onChange={(e) => setRoyaltyRate(Number(e.target.value))}
                    className="viq-input w-full px-4 py-2.5"
                  />
                  <p className="mt-1 text-[10px] viq-text-muted">
                    HQ royalty percentage for this center. Default is 25%.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
                  <span className="text-[11px] font-mono uppercase text-orange-500 font-bold block">
                    Branch Incharge / Manager Credentials
                  </span>

                  <div>
                    <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                      Manager Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Amandeep Kaur"
                      className="viq-input w-full px-4 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                      Manager Official Email (Receives OTP Token) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="jalandhar@viqtech.in"
                        className="viq-input w-full pl-9 pr-4 py-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">
                      Security Passkey / Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="viq-input w-full pl-9 pr-4 py-2.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Email & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Email OTP Authentication View */}
            {modalStep === 'OTP' && (
              <form onSubmit={handleVerifyAndProvision} className="space-y-5 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-200">Enter Security Token</p>
                  <p className="text-[11px] text-slate-400">
                    A 6-digit numeric clearance code has been transmitted to <strong className="text-white">{managerEmail}</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1 text-center">
                    6-Digit Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="viq-input w-full py-3.5 text-center font-mono text-2xl tracking-[0.5em] font-black"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setModalStep('FORM')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    ← Edit Details
                  </button>

                  {otpTimer > 0 ? (
                    <span className="viq-text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend in {otpTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => void handleRequestOtp(e)}
                      className="text-orange-500 hover:underline font-bold cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || otpCode.length < 6}
                    className="flex-1 py-3 rounded-xl viq-btn-primary text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorize & Deploy</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}