'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Maximize2, 
  Minimize2, 
  Send, 
  Sparkles, 
  Loader2, 
  Code2 
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

export default function AiFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey! Main aapka VIQ Tech AI Mentor hoon. Coding, DSA ya lab task me koi doubt ho toh poohein!',
      provider: 'System',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

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
          content: `Error: ${err.message || 'AI connect nahi ho paya.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Circular Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-black shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 group cursor-pointer"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-7 w-7 text-white drop-shadow group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
          </span>
        </button>
      )}

      {/* 2. Chatbox Window (Popup Drawer & FullScreen Mode) */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-[#0D111A] border border-white/10 shadow-2xl transition-all duration-200 backdrop-blur-xl ${
            isFullScreen
              ? 'inset-2 sm:inset-6 rounded-2xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121620] rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>VIQ AI Mentor</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Ask coding & tech queries</p>
              </div>
            </div>

            {/* Window Controls: Maximize/Minimize & Close */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition cursor-pointer"
                title={isFullScreen ? 'Restore Size' : 'Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 hover:text-red-400 transition cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-black font-semibold'
                      : 'bg-[#121620] border border-white/10 text-slate-200'
                  }`}
                >
                  {m.content}
                  {m.provider && (
                    <div className="mt-1.5 text-[8px] font-mono text-slate-500 border-t border-white/5 pt-1">
                      via {m.provider}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                <span>Thinking solution...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Input Field */}
          <form
            onSubmit={handleSend}
            className="p-2.5 sm:p-3 border-t border-white/10 bg-[#121620] flex gap-2 rounded-b-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask code doubt or bug error..."
              className="flex-1 rounded-xl border border-white/10 bg-[#07090E] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}