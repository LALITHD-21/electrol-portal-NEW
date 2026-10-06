'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface MobileSplashScreenProps {
  /**
   * Duration in milliseconds before automatic dismissal
   * Default: 2600ms (2.6s)
   */
  durationMs?: number;
  /**
   * If true, always force show the splash screen (useful for testing or manual trigger)
   */
  forceShow?: boolean;
}

export default function MobileSplashScreen({
  durationMs = 2600,
  forceShow = false,
}: MobileSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingText, setLoadingText] = useState('Connecting to Electoral Registry...');
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Only show on mobile devices (width < 640px)
    const isMobile = window.innerWidth < 640;
    if (!isMobile && !forceShow) {
      return;
    }

    // Check if already displayed in current session
    const hasSeenSplash = sessionStorage.getItem('electoral_splash_shown');
    if (hasSeenSplash && !forceShow) {
      return;
    }

    // Mark as visible
    setIsVisible(true);

    // Staged realistic progress animation for top-tier UI/UX feel
    const timer1 = setTimeout(() => {
      setProgress(48);
      setLoadingText('Loading Karnataka Council Demographic Rolls...');
    }, 650);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setLoadingText('Synchronizing 151 Polling Stations...');
    }, 1450);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setLoadingText('Constituency Intelligence Verified');
    }, 2150);

    const timer4 = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [durationMs, forceShow]);

  const handleDismiss = () => {
    setIsExiting(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('electoral_splash_shown', 'true');
    }
    // Remove from DOM after exit animation finishes (550ms)
    setTimeout(() => {
      setIsVisible(false);
    }, 550);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      onClick={handleDismiss}
      className={`sm:hidden fixed inset-0 z-[99999] bg-[#0c2340] flex flex-col justify-between overflow-hidden select-none transition-all duration-600 ease-out cursor-pointer ${
        isExiting
          ? 'opacity-0 scale-[1.04] blur-[2px] pointer-events-none'
          : 'opacity-100 scale-100 blur-0'
      }`}
      aria-label="App Splash Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* 4K/HD Original Artwork Display */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <Image
          src="/splash-mobile.jpg"
          alt="Karnataka Legislative Council Electoral Lookup Splash Poster"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center select-none"
        />

        {/* Floating Glassmorphism UI/UX Loading Bar Card */}
        <div className="absolute bottom-6 left-0 right-0 px-4 flex flex-col items-center z-20 pb-[max(0.5rem,env(safe-area-inset-bottom))] animate-fadeIn">
          <div className="w-full max-w-[325px] bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 border border-white/80 shadow-[0_12px_36px_rgba(15,23,42,0.22)] space-y-2.5 transition-all">
            {/* Top row: live status dot, step description & percent */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span className="text-[11px] font-bold text-slate-800 truncate tracking-tight">
                  {loadingText}
                </span>
              </div>
              <span className="font-mono text-[11px] font-black text-indigo-700 flex-shrink-0">
                {progress}%
              </span>
            </div>

            {/* Tri-color Glowing Progress Bar */}
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Micro-shimmer light reflection */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Bottom Dismiss / Skip Hint */}
            <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400 font-semibold">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Authorized Portal</span>
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="uppercase tracking-widest text-[9.5px] font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Tap to enter ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
