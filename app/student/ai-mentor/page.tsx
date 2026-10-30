'use client';

import AiMentorChat from '@/components/student/AiMentorChat';

export default function StudentAiMentorPage() {
  return (
    <div className="min-h-screen bg-[#07090E] p-4 sm:p-8 text-white">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-white">
          VIQ Tech <span className="text-orange-500">AI Mentor</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          24/7 coding assistance, debugging, and framework support.
        </p>
      </div>

      <AiMentorChat />
    </div>
  );
}