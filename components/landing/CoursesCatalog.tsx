'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowUpRight, Sparkles, Code2, ShieldCheck, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code?: string;
  duration: string;
  fee: number;
  description?: string;
  icon?: LucideIcon;
}

const FALLBACK_COURSES: Course[] = [
  {
    id: 'crs-1',
    name: 'Full-Stack Web Development (MERN)',
    code: 'VIQ-FS-101',
    duration: '6 Months',
    fee: 25000,
    description: 'Master MongoDB, Express, React, and Node.js. Build and deploy real-world enterprise applications from scratch.',
    icon: Code2,
  },
  {
    id: 'crs-2',
    name: 'Cybersecurity & Ethical Hacking',
    code: 'VIQ-SEC-202',
    duration: '4 Months',
    fee: 20000,
    description: 'Learn VAPT, network security, penetration testing, and cryptography to defend against modern cyber threats.',
    icon: ShieldCheck,
  },
  {
    id: 'crs-3',
    name: 'AI & Machine Learning with Python',
    code: 'VIQ-AI-303',
    duration: '6 Months',
    fee: 28000,
    description: 'Deep dive into Data Science, Neural Networks, predictive analytics, and building intelligent AI models.',
    icon: Cpu,
  },
];

export default function CoursesCatalog() {
  const [courses, setCourses] = useState<Course[]>(FALLBACK_COURSES);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.courses || [];
          if (list.length > 0) {
            setCourses(list);
          }
        }
      } catch {
        // Fallback courses remain active
      }
    }
    fetchCourses();
  }, []);

  return (
    <section id="courses" className="viq-section relative py-28 px-6 sm:px-12 overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10 space-y-14">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 viq-pill px-3.5 py-1.5 text-orange-600 dark:text-orange-400 text-[11px] font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              [ 03 // INDUSTRIAL TRAINING ]
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Future-ready <br />
              <span className="viq-gradient-text">certification programs.</span>
            </h2>
          </div>

          <Link
            href="/login"
            className="viq-pill px-5 py-3 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition self-start md:self-auto flex items-center gap-2"
          >
            <span>Student Portal Login</span>
            <ArrowUpRight className="w-4 h-4 text-orange-500" />
          </Link>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course, idx) => {
            const Icon = course.icon || Code2;
            return (
              <div
                key={course.id || idx}
                className="group viq-card p-7 flex flex-col justify-between min-h-[340px]"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[11px] font-mono font-bold">
                      {course.code || `VIQ-PROG-0${idx + 1}`}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs viq-text-muted font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration || '6 Months'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-neutral-300 group-hover:text-orange-500 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors leading-snug">
                      {course.name}
                    </h3>
                  </div>

                  <p className="text-xs viq-text-secondary leading-relaxed line-clamp-3">
                    {course.description || 'Comprehensive practical training with live project evaluations.'}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono uppercase viq-text-muted">
                      Program Tuition
                    </span>
                    <span className="text-lg font-black font-mono">
                      ₹{Number(course.fee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    href="/login"
                    className="viq-pill px-4 py-2 text-xs font-bold hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-all flex items-center gap-1.5"
                  >
                    <span>Enroll</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}