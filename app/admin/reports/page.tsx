'use client';

import { FileSpreadsheet, Download, Wallet, Users } from 'lucide-react';

export default function AdminReportsPage() {
  const triggerCsvDownload = (filename: string, rows: string[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRevenueMatrix = () => {
    triggerCsvDownload('VIQ_Technologies_Branch_Revenue_2026.csv', [
      ['Branch Code', 'Branch Name', 'City', 'Students', 'Collected Fee (INR)', 'HQ Royalty (25%)'],
      ['VIQ-KHN-01', 'VIQ Technologies Khanna HQ', 'Khanna', '145', '2610000', '652500'],
      ['VIQ-LDH-02', 'VIQ Technologies Ludhiana', 'Ludhiana', '110', '2090000', '522500'],
      ['VIQ-CHD-03', 'VIQ Technologies Chandigarh', 'Chandigarh', '190', '3800000', '1140000'],
    ]);
  };

  const exportStudentLedger = () => {
    triggerCsvDownload('VIQ_Technologies_Master_Students_2026.csv', [
      ['Enrollment ID', 'Student Name', 'Program', 'Branch', 'Fee Status'],
      ['VIQ-2026-101', 'Aarav Verma', 'Full-Stack MERN', 'Khanna HQ', 'CLEARED'],
      ['VIQ-2026-102', 'Priya Sharma', 'Cybersecurity & VAPT', 'Ludhiana Node', 'EMI_ACTIVE'],
      ['VIQ-2026-103', 'Rohan Mehta', 'AI & Machine Learning', 'Chandigarh Node', 'CLEARED'],
    ]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border-color)]">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Audit & Financial CSV Reports
        </h1>
        <p className="text-xs viq-text-secondary mt-1">
          Export tamper-evident financial ledgers, branch royalty statements, and candidate rosters.
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenue Export Card */}
        <div className="viq-card p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black">Multi-Branch Revenue & Royalty Statement</h3>
            <p className="text-xs viq-text-secondary leading-relaxed">
              Includes branch-by-branch gross tuition collection, pending EMI receivables, and calculated HQ royalty shares.
            </p>
          </div>

          <button
            onClick={exportRevenueMatrix}
            className="viq-btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Revenue CSV</span>
          </button>
        </div>

        {/* Student Roster Export Card */}
        <div className="viq-card p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black">Master Candidate & Compliance Roster</h3>
            <p className="text-xs viq-text-secondary leading-relaxed">
              Complete directory of enrolled candidates, assigned centers, course codes, and fee clearance statuses.
            </p>
          </div>

          <button
            onClick={exportStudentLedger}
            className="viq-pill w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 hover:border-emerald-500 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Download Student Roster CSV</span>
          </button>
        </div>

      </div>

    </div>
  );
}