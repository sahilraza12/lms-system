'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Code2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

export default function AiMentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey! Main aapka VIQ Tech AI Mentor hoon. Coding, DSA, Next.js, database queries ya interview prep me koi bhi doubt ho toh poohein!',
      provider: 'System',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/student/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Response error');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, provider: data.provider },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message || 'AI se connect karne me problem hui.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#0D111A] overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#121620]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>VIQ Tech AI Mentor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Multi-LLM Active
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Auto-failover enabled (Groq ➔ Gemini ➔ OpenAI)</p>
          </div>
        </div>
        <Code2 className="h-4 w-4 text-slate-500" />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs sm:text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-orange-500 text-black font-medium'
                  : 'bg-[#121620] border border-white/10 text-slate-200'
              }`}
            >
              {m.content}

              {m.provider && (
                <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-white/5 pt-1">
                  Powered by {m.provider}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            <span>AI coding solution prepare kar raha hai...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#121620] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Apna code error ya technical doubt poochhein..."
          className="flex-1 rounded-xl border border-white/10 bg-[#07090E] px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
} 