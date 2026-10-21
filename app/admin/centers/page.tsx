'use client';

import { useState } from 'react';
import { Building2, Plus, MapPin, Users, Wallet, ShieldCheck } from 'lucide-react';

const INITIAL_CENTERS = [
  { id: 'ctr-1', name: 'VIQ Technologies - Khanna HQ', code: 'VIQ-KHN-01', city: 'Khanna', students: 145, revenue: '₹26,10,000', status: 'ACTIVE' },
  { id: 'ctr-2', name: 'VIQ Technologies - Ludhiana', code: 'VIQ-LDH-02', city: 'Ludhiana', students: 110, revenue: '₹20,90,000', status: 'ACTIVE' },
  { id: 'ctr-3', name: 'VIQ Technologies - Chandigarh', code: 'VIQ-CHD-03', city: 'Chandigarh', students: 190, revenue: '₹38,00,000', status: 'ACTIVE' },
];

export default function AdminCentersPage() {
  const [centers, setCenters] = useState(INITIAL_CENTERS);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCode, setNewCode] = useState('');

  const handleAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCity || !newCode) return;

    const newCenter = {
      id: `ctr-${Date.now()}`,
      name: newName,
      code: newCode.toUpperCase(),
      city: newCity,
      students: 0,
      revenue: '₹0',
      status: 'ACTIVE',
    };

    setCenters([newCenter, ...centers]);
    setNewName('');
    setNewCity('');
    setNewCode('');
    setShowModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Franchise Centers Management
          </h1>
          <p className="text-xs viq-text-secondary mt-1">
            Register new partner nodes, monitor branch capacity, and oversee local node administrators.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="viq-btn-primary inline-flex items-center gap-2 px-5 py-3 text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Center</span>
        </button>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {centers.map((c) => (
          <div key={c.id} className="viq-card p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="viq-pill px-3 py-1 text-orange-500 font-bold text-[11px] font-mono border-orange-500/30">
                  {c.code}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                  {c.status}
                </span>
              </div>

              <h3 className="text-lg font-black leading-snug">{c.name}</h3>

              <p className="text-xs viq-text-secondary flex items-center gap-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                {c.city} Node
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="viq-text-muted block text-[10px] uppercase font-bold">Students</span>
                <span className="font-black text-lg">{c.students}</span>
              </div>
              <div>
                <span className="viq-text-muted block text-[10px] uppercase font-bold">Revenue</span>
                <span className="text-emerald-500 font-black text-lg">{c.revenue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="viq-card bg-[var(--bg-primary)] max-w-md w-full p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black">Register Partner Branch</h3>
              <p className="text-xs viq-text-secondary">Add a new institutional node to the VIQ network.</p>
            </div>

            <form onSubmit={handleAddCenter} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Center Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VIQ Technologies - Jalandhar"
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Jalandhar"
                  className="viq-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase viq-text-muted font-bold block mb-1">Branch Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="VIQ-JAL-04"
                  className="viq-input w-full px-4 py-3 text-xs uppercase font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl viq-pill text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl viq-btn-primary text-xs transition"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}