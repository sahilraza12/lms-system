import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Production me yeh data aapke session/JWT cookies se aayega
  const userRole = 'CENTER'; // Default view for development
  const userName = 'Ludhiana Central Branch';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar role={userRole} userName={userName} />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}