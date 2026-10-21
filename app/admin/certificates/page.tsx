'use client';

import { useState } from 'react';
import { Award, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const INITIAL_CERTS = [
  { id: 'VIQ-2026-101', student: 'Aarav Verma', course: 'Full-Stack MERN', branch: 'Khanna HQ', hash: '0x8F92...3B9E', status: 'ISSUED' },
  { id: 'VIQ-2026-102', student: 'Rohan Mehta', course: 'Cybersecurity & VAPT', branch: 'Chandigarh Node', hash: '0x4A19...9F21', status: 'ISSUED' },
  { id: 'VIQ-2026-103', student: 'Priya Sharma', course: 'AI & Machine Learning', branch: 'Ludhiana Node', hash: 'PENDING_CLEARANCE', status: 'REVIEW' },
];

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState(INITIAL_CERTS);

  const handleApprove = (id: string) => {
    setCerts(
      certs.map((c) =>
        c.id === id
          ? { ...c, status: 'ISSUED', hash: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}` }
          : c
      )
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border-color)]">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Cryptographic Certificate Clearance
        </h1>
        <p className="text-xs viq-text-secondary mt-1">
          Approve candidate academic clearance and generate SHA-256 tamper-proof credential hashes.
        </p>
      </div>

      {/* Certificates List */}
      <div className="viq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase viq-text-muted bg-[var(--bg-glass-subtle)]">
                <th className="py-3.5 px-6 font-bold">Credential ID</th>
                <th className="py-3.5 px-6 font-bold">Candidate</th>
                <th className="py-3.5 px-6 font-bold">Program</th>
                <th className="py-3.5 px-6 font-bold">Branch Node</th>
                <th className="py-3.5 px-6 font-bold">Verification Hash</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                <th className="py-3.5 px-6 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {certs.map((cert) => (
                <tr key={cert.id} className="hover:bg-[var(--bg-glass-subtle)] transition">
                  <td className="py-4 px-6 font-mono text-orange-500 font-bold">{cert.id}</td>
                  <td className="py-4 px-6 font-bold">{cert.student}</td>
                  <td className="py-4 px-6 viq-text-secondary font-medium">{cert.course}</td>
                  <td className="py-4 px-6 viq-text-secondary">{cert.branch}</td>
                  <td className="py-4 px-6 font-mono viq-text-muted">{cert.hash}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                        cert.status === 'ISSUED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {cert.status === 'REVIEW' ? (
                      <button
                        onClick={() => handleApprove(cert.id)}
                        className="viq-btn-primary px-3 py-1.5 text-[11px]"
                      >
                        Approve & Issue
                      </button>
                    ) : (
                      <Link
                        href={`/certificate/${cert.id}`}
                        className="inline-flex items-center gap-1 viq-pill px-3 py-1.5 font-mono text-[11px] font-bold hover:text-[var(--text-primary)]"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}