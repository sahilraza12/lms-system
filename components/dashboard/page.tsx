export default function DashboardPage() {
  const stats = [
    { label: 'Active Teachers', value: '12', change: '+2 this month' },
    { label: 'Total Students', value: '184', change: '8 batches' },
    { label: 'Pending Dues', value: '₹1,45,000', change: '14 accounts' },
    { label: 'Active Notices', value: '3', change: 'Dual dispatched' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Branch Overview</h1>
        <p className="text-sm text-slate-500">Live operational stats for this center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{s.value}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">{s.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}