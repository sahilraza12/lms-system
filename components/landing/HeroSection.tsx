'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import { ArrowRight, Sparkles } from 'lucide-react';

const videoPlaylist = [
  '/299527_medium.mp4',
  '/303927_medium.mp4',
  '/318322_medium.mp4',
  '/342901_medium.mp4',
  '/364228_medium.mp4',
];

export default function HeroSection() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videoPlaylist.length);
  };

  return (
    <section className="viq-page relative min-h-screen w-full flex flex-col justify-between overflow-hidden px-6 sm:px-12 pt-28 pb-12">
      
      {/* Floating Navbar */}
      <Navbar />

      {/* Background Multi-Video Player & Grid */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          key={videoPlaylist[currentVideoIndex]}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={videoPlaylist[currentVideoIndex]}
          autoPlay
          muted
          loop={false}
          playsInline
          onEnded={handleVideoEnded}
          preload="auto"
        />
        <div className="absolute inset-0 viq-grid-bg opacity-40" />
        <div
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          }}
          className="absolute -top-20 left-1/4 w-[650px] h-[450px] blur-3xl pointer-events-none"
        />
      </div>

      {/* Main Clean Hero Layout (Without Telemetry Box) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex items-center py-12">
        <div className="max-w-3xl space-y-7">
          
          <div className="inline-flex items-center gap-2 viq-pill px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Empowering Futures with Technology & Innovation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.06]">
            From Concept to Code: <br />
            Your Digital Future <br />
            <span className="viq-gradient-text">Starts at VIQ Tech.</span>
          </h1>

          <p className="text-sm sm:text-base viq-text-secondary max-w-xl leading-relaxed">
            VIQ Technologies delivers cutting-edge IT services and industry-ready industrial training in{' '}
            <strong>Cybersecurity (VAPT), Cloud Computing, AI & Machine Learning, Web/App Development</strong>, and Digital Marketing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/login"
              className="viq-btn-primary px-7 py-4 text-xs flex items-center gap-2"
            >
              <span>Launch LMS Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="#courses"
              className="viq-pill px-6 py-4 text-xs font-bold"
            >
              Explore Training & Services
            </Link>
          </div>

          {/* VIQ Technologies Highlights */}
          <div
            className="pt-8 grid grid-cols-3 gap-6 max-w-lg"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div>
              <p className="text-xl font-black font-mono" style={{ color: '#f97316' }}>50+</p>
              <p className="text-[11px] viq-text-muted uppercase font-mono">IT Professionals</p>
            </div>
            <div>
              <p className="text-xl font-black font-mono">24×7</p>
              <p className="text-[11px] viq-text-muted uppercase font-mono">Lab & Mentorship</p>
            </div>
            <div>
              <p className="text-xl font-black font-mono text-emerald-500">100%</p>
              <p className="text-[11px] viq-text-muted uppercase font-mono">Verified Certs</p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Status Bar */}
      <div
        className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between viq-text-muted text-[11px] font-mono pt-4"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <span>[ VIQ TECHNOLOGIES // AUTONOMOUS LMS & ERP ]</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          SYSTEM ONLINE
        </span>
      </div>

    </section>
  );
}