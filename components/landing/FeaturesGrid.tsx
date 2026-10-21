'use client';

import { 
  Code2, 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  Cloud, 
  Smartphone, 
  Briefcase, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';

export default function FeaturesGrid() {
  return (
    <section id="features" className="viq-section relative py-28 px-6 sm:px-12 overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10 space-y-16">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 viq-pill px-3.5 py-1.5 text-orange-600 dark:text-orange-400 text-[11px] font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            [ 02 // ENTERPRISE IT & TRAINING ]
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">
            Bridging the gap between <br />
            <span className="viq-gradient-text">academics & industry.</span>
          </h2>
          <p className="viq-text-secondary text-sm sm:text-base leading-relaxed">
            VIQ Technologies provides end-to-end IT solutions for businesses and 100% practical, industry-aligned training programs for students to master modern tech stacks.
          </p>
        </div>

        {/* Adaptive Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Card 1: 7 Cols (Software & App Dev) */}
          <div className="md:col-span-7 group viq-card p-8 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-3 max-w-md">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Full-Stack & Mobile Development
              </h3>
              <p className="text-xs sm:text-sm viq-text-secondary leading-relaxed">
                From scalable MERN stack web applications to native iOS & Android mobile apps. We build enterprise-grade software and train candidates on live production codebases.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="viq-pill px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
                  <Terminal className="w-3.5 h-3.5 text-orange-500" /> React & Next.js
                </span>
                <span className="viq-pill px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> React Native
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-orange-500 group-hover:translate-x-1 transition-transform">
                ENTERPRISE GRADE →
              </span>
            </div>
          </div>

          {/* Bento Card 2: 5 Cols (Cybersecurity & VAPT) */}
          <div className="md:col-span-5 group viq-card p-8 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Cybersecurity & VAPT
              </h3>
              <p className="text-xs sm:text-sm viq-text-secondary leading-relaxed">
                Security-first mindset. We conduct Vulnerability Assessments and Penetration Testing (VAPT) to secure organizational infrastructures.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/10 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between viq-text-muted">
                <span>SECURITY AUDIT</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SECURED
                </span>
              </div>
              <div className="viq-text-secondary truncate font-semibold">
                NETWORK & APP DEFENSE ACTIVE
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards */}
          <div className="md:col-span-4 viq-card p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">AI & Machine Learning</h3>
              <p className="text-xs viq-text-secondary leading-relaxed">
                Unlock the power of data with advanced AI algorithms, predictive analytics, and Python-based machine learning pipelines.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-[10px] font-mono viq-text-muted uppercase tracking-widest">
              DATA-DRIVEN INNOVATION
            </div>
          </div>

          <div className="md:col-span-4 viq-card p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Cloud & DevOps</h3>
              <p className="text-xs viq-text-secondary leading-relaxed">
                Scalable cloud deployments using AWS, Docker, and Kubernetes. Ensuring zero-downtime and continuous integration.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-[10px] font-mono viq-text-muted uppercase tracking-widest">
              99.9% UPTIME GUARANTEED
            </div>
          </div>

          <div className="md:col-span-4 viq-card p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Placement & Certification</h3>
              <p className="text-xs viq-text-secondary leading-relaxed">
                100% verified digital certifications and dedicated placement assistance to launch your career in top MNCs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-[10px] font-mono viq-text-muted uppercase tracking-widest">
              INDUSTRY RECOGNIZED
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}