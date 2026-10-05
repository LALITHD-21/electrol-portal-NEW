'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface MobileSplashScreenProps {
  /**
   * Duration in milliseconds before automatic dismissal
   * Default: 2400ms (2.4s)
   */
  durationMs?: number;
  /**
   * If true, always force show the splash screen (useful for testing or manual trigger)
   */
  forceShow?: boolean;
}

export default function MobileSplashScreen({
  durationMs = 2400,
  forceShow = false,
}: MobileSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingText, setLoadingText] = useState('Connecting to Electoral Registry...');
  const [progress, setProgress] = useState(15);

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

    // Staged status messages and progress simulation
    const timer1 = setTimeout(() => {
      setProgress(55);
      setLoadingText('Loading Constituency Demographic Rolls...');
    }, 800);

    const timer2 = setTimeout(() => {
      setProgress(90);
      setLoadingText('Electoral Roll Intelligence Ready');
    }, 1600);

    const timer3 = setTimeout(() => {
      setProgress(100);
      handleDismiss();
    }, durationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [durationMs, forceShow]);

  const handleDismiss = () => {
    setIsExiting(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('electoral_splash_shown', 'true');
    }
    // Remove from DOM after exit animation finishes (500ms)
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
      className={`sm:hidden fixed inset-0 z-[99999] bg-gradient-to-b from-[#eaf2fd] via-white to-[#f1f6fd] flex flex-col justify-between overflow-hidden select-none transition-all duration-500 ease-out cursor-pointer ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="App Splash Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Graphic Poster */}
      <div className="relative w-full h-full flex flex-col items-center justify-between">
        <div className="relative w-full flex-1 max-w-md mx-auto flex items-center justify-center p-0">
          <Image
            src="/splash-mobile.jpg"
            alt="Electoral-Lookup Karnataka Legislative Council Splash"
            fill
            sizes="100vw"
            priority
            className="object-cover xs:object-contain object-center select-none"
          />
        </div>

        {/* Interactive Bottom Bar & Loading Status */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white/95 via-white/80 to-transparent backdrop-blur-[2px] flex flex-col items-center text-center space-y-2.5 z-10 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
          {/* Native Loading Bar */}
          <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dynamic Loading Step Text */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping inline-block" />
            <p className="text-[11px] font-bold text-slate-600 tracking-wide">
              {loadingText}
            </p>
          </div>

          {/* Skip Hint */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors pt-0.5"
          >
            Tap anywhere to enter ›
          </button>
        </div>
      </div>
    </div>
  );
}
