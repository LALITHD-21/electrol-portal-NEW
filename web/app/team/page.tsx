'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Smartphone,
  Check,
  AlertCircle,
  Loader2,
  Share,
  PlusSquare,
  X,
  ArrowLeft,
  ShieldCheck,
  Compass,
  ChevronDown,
  Clock,
  Lock,
} from 'lucide-react';

export default function TeamLoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rate Limiting & Lockout State (5 failed attempts -> 2 min lockout)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isIpad, setIsIpad] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Check existing lockout status on mount
  useEffect(() => {
    try {
      const savedLock = localStorage.getItem('team_login_locked_until');
      if (savedLock) {
        const lockTimestamp = parseInt(savedLock, 10);
        if (lockTimestamp > Date.now()) {
          setLockedUntil(lockTimestamp);
        } else {
          localStorage.removeItem('team_login_locked_until');
        }
      }
    } catch {}

    // Verify rate limit status from server
    fetch('/api/auth/login')
      .then((res) => res.json())
      .then((data) => {
        if (data.isLocked && data.lockedUntil && data.lockedUntil > Date.now()) {
          setLockedUntil(data.lockedUntil);
          try {
            localStorage.setItem('team_login_locked_until', String(data.lockedUntil));
          } catch {}
        } else if (typeof data.attemptsLeft === 'number') {
          setAttemptsLeft(data.attemptsLeft);
        }
      })
      .catch(() => {});
  }, []);

  // Ticking countdown timer effect
  useEffect(() => {
    if (!lockedUntil) {
      setSecondsLeft(0);
      return;
    }

    const checkLockStatus = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
        setAttemptsLeft(5);
        setError(null);
        try {
          localStorage.removeItem('team_login_locked_until');
        } catch {}
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Format MM:SS for countdown timer
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLockedOut = Boolean(lockedUntil && secondsLeft > 0);

  useEffect(() => {
    // Robust iOS and iPadOS detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);
    const isIpadDevice =
      /ipad/.test(ua) ||
      (ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1);

    setIsIos(isIosDevice);
    setIsIpad(isIpadDevice);

    if (isIosDevice) {
      const inApp =
        /instagram|fbav|fban|whatsapp|line|micromessenger|snapchat|twitter/i.test(
          ua
        ) || (!(window as any).safari && !/crios|fxios|edgios/i.test(ua));
      setIsInAppBrowser(inApp);
    }

    // Check if already standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Capture PWA install prompt on Android/Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !pin) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedUser, password: pin }),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Locked out: 5 failed attempts reached
        const lockTime = data.lockedUntil || Date.now() + 120 * 1000;
        setLockedUntil(lockTime);
        setAttemptsLeft(0);
        try {
          localStorage.setItem('team_login_locked_until', String(lockTime));
        } catch {}
        setError(
          data.error ||
            'Too many failed attempts (5/5). Account temporarily locked for 2 minutes. Please try again after 2 minutes.'
        );
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        if (typeof data.attemptsLeft === 'number') {
          setAttemptsLeft(data.attemptsLeft);
        }
        setError(data.error || 'Invalid credentials. Please verify your password.');
        setIsLoading(false);
        return;
      }

      // Successful login -> Clear local lock, set admin splash flag, and navigate to admin desk
      try {
        localStorage.removeItem('team_login_locked_until');
        sessionStorage.setItem('admin_login_splash', 'true');
      } catch {}
      window.location.href = '/admin/requests';
    } catch {
      setError('Connection failed. Please check your network connection.');
      setIsLoading(false);
    }
  };

  const handleInstallClick = () => {
    setShowInstallSheet(true);
  };

  const handleTriggerNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallSheet(false);
    } else if (isIos) {
      // Keep sheet open to read iOS steps
    } else {
      alert(
        'To install the app, tap your browser menu (⋮) in the top-right corner and select "Add to Home screen" or "Install App".'
      );
      setShowInstallSheet(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-slate-50 p-4 text-slate-800">
      {/* Centered Login Box */}
      <div className="w-full max-w-[340px] bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 animate-scaleIn">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Team login
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            For the campaign team and booth karyakartas.
          </p>
        </div>

        {/* 2-Minute Lockout Countdown Card */}
        {isLockedOut ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 animate-fadeIn">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-950">
                  Account Temporarily Locked
                </p>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Maximum login attempts exceeded (5/5). Please try again after 2 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-200/80">
              <span className="text-[11px] font-semibold text-amber-900">
                Try again in:
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-200 text-amber-950 font-mono font-black text-sm tracking-wider shadow-2xs">
                {formatTimer(secondsLeft)}
              </span>
            </div>
          </div>
        ) : (
          error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              disabled={isLoading || isLockedOut}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={isLoading || isLockedOut}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-h-[42px]"
            />
          </div>

          {/* Log in Button with Countdown integration */}
          <button
            type="submit"
            disabled={isLoading || isLockedOut}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Checking...</span>
              </>
            ) : isLockedOut ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Try again in {formatTimer(secondsLeft)}</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>

          {/* Install KMS Team app on this phone button */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-2xs transition active:scale-[0.98] flex items-center justify-center gap-2 min-h-[40px]"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Install Team app on this phone</span>
          </button>
        </form>

        {/* Back to public search link */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to voter search</span>
          </Link>
        </div>
      </div>

      {/* PWA Install Modal / Bottom Sheet */}
      {showInstallSheet && (
        <div
          className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowInstallSheet(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 text-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-slideUp sm:animate-scaleIn my-auto border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Install Team App
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallSheet(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* App Info row (Icon + Name + Domain) */}
            <div className="flex items-center gap-3.5 py-1">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-zinc-700 flex items-center justify-center shadow-md flex-shrink-0">
                <Image
                  src="/app-logo.png"
                  alt="App Logo"
                  width={36}
                  height={36}
                  className="rounded-xl object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white leading-tight truncate">
                  Shashi Hulikuntemutt Team · Voter Manager
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  South-East Graduates&apos; Constituency
                </p>
              </div>
            </div>

            {/* In-App Browser Warning on iOS */}
            {isIos && isInAppBrowser && (
              <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-800/80 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Compass className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Open in Safari first</span>
                </div>
                <p className="text-[11px] leading-snug text-amber-200/90">
                  Tap the menu (•••) or share button in WhatsApp/Instagram, and select <strong>&quot;Open in Safari&quot;</strong> to install.
                </p>
              </div>
            )}

            {/* iOS Instructions (iPhone / iPad) */}
            {isIos ? (
              <div className="bg-zinc-800/90 rounded-2xl p-3.5 space-y-2.5 text-xs text-zinc-300 border border-zinc-700/80">
                <p className="font-bold text-white text-xs">
                  {isIpad ? 'Install steps for iPad:' : 'Install steps for iPhone:'}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-900 text-sky-400 flex-shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <span>
                    1. Tap the <strong>Share</strong> button {isIpad ? 'in the top toolbar' : 'at the bottom of Safari'}.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-900 text-emerald-400 flex-shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-900 text-amber-400 flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>3. Tap <strong>Add</strong> in the top right corner.</span>
                </div>

                {!isIpad && (
                  <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-sky-400 font-bold animate-bounce">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Look for Share button at the bottom</span>
                  </div>
                )}
              </div>
            ) : (
              /* Android / Desktop Instructions */
              <div className="bg-zinc-800/90 rounded-2xl p-3.5 space-y-2 text-xs text-zinc-300 border border-zinc-700/80">
                <p className="font-bold text-white text-xs">Android &amp; Desktop:</p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Tap <strong>Install</strong> below, or tap your browser menu (<strong>⋮</strong>) and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>
            )}

            {/* Actions: Close & Install */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInstallSheet(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                {isIos ? 'Got it' : 'Cancel'}
              </button>

              {!isIos && (
                <button
                  type="button"
                  onClick={handleTriggerNativeInstall}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow transition active:scale-95"
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
