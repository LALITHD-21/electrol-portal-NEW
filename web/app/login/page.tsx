'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Zap,
  Building2,
  Database,
  Sparkles,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';
import { Button, SpecularButton } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/search';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Load saved username on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('elector_portal_saved_user');
      if (savedUser) {
        setIdentifier(savedUser);
      }
    } catch {
      // ignore localStorage errors in private mode
    }
  }, []);

  // Listen for CapsLock
  const handleKeyDetection = (e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const rawInput = identifier.trim();
    if (!rawInput || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: rawInput, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please verify your username and password.');
        setIsLoading(false);
        return;
      }

      // Save remember username
      if (rememberUser) {
        try {
          localStorage.setItem('elector_portal_saved_user', rawInput);
        } catch {}
      } else {
        try {
          localStorage.removeItem('elector_portal_saved_user');
        } catch {}
      }

      window.location.href = redirectPath;
    } catch {
      setError('Network connection error. Please check your internet connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-scaleIn">
      {/* Outer Card with Glassmorphic Backdrop */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-elevated border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-card-hover">
        {/* Accent Tri-Color Top Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-brand-600 to-emerald-500 w-full" />

        <div className="p-6 sm:p-8 space-y-5">
          {/* Card Header with Emblem for Mobile & Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-brand-500/20 via-amber-400/20 to-emerald-500/20 blur-md animate-pulseGlow" />
              <Image
                src="/logo-emblem.png"
                alt="ELECTORAL-LOOKUP Emblem"
                fill
                priority
                unoptimized
                sizes="96px"
                className="object-contain relative z-10 drop-shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Karnataka Legislative Council</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                ELECTORAL-LOOKUP
              </h1>
              <p className="text-xs font-bold text-brand-700">
                South-East &amp; Central Karnataka Constituency
              </p>
              <p className="text-[11px] text-slate-500">
                Official Electoral Roll Intelligence &amp; Lookup Portal
              </p>
            </div>
          </div>

          {/* Error Alert Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200/90 rounded-2xl animate-shake shadow-2xs text-left"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left" noValidate>
            {/* Username Input */}
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Username / Operator ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  ref={usernameInputRef}
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDetection}
                  onKeyUp={handleKeyDetection}
                  disabled={isLoading}
                  placeholder="Enter authorized username"
                  className="w-full min-h-[48px] pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-60 transition shadow-2xs"
                />
                {identifier && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('');
                      usernameInputRef.current?.focus();
                    }}
                    aria-label="Clear username"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                {isCapsLockOn && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                    <span>CAPS LOCK ON</span>
                  </span>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDetection}
                  onKeyUp={handleKeyDetection}
                  disabled={isLoading}
                  placeholder="Enter system password"
                  className="w-full min-h-[48px] pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-60 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 pl-2 flex items-center justify-center text-slate-400 hover:text-slate-600 active:text-brand-600 min-h-[44px] min-w-[44px] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Username Checkbox & Help */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                />
                <span className="font-medium">Remember on this device</span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need Access?</span>
              </button>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <SpecularButton
                type="submit"
                size="lg"
                variant="primary"
                tint="#4338ca"
                tintOpacity={1}
                lineColor="#a5b4fc"
                baseColor="#312e81"
                textColor="#ffffff"
                intensity={1.2}
                radius={16}
                speed={0.4}
                autoAnimate={true}
                followMouse={true}
                proximity={300}
                fullWidth
                isLoading={isLoading}
                loadingText="Authenticating Session..."
                leftIcon={<KeyRound className="w-4 h-4 text-indigo-200" />}
                className="h-12 min-h-[48px] rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-950/20 active:scale-[0.98]"
              >
                Sign In to System
              </SpecularButton>
            </div>
          </form>

          {/* Compliance & Security Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit SSL Session • Row-Level Security</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Karnataka Legislative Council Official Electoral Gateway
            </p>
          </div>
        </div>
      </div>

      {/* Access Guidance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-elevated border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">System Access Guidance</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Access to the South-East &amp; Central Karnataka Constituency Electoral Portal is strictly restricted to authorized election officers, constituency operators, and appointed field personnel.
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">Returning Officer Helpline:</span>
                <p className="text-[11px] text-slate-500">
                  If you have not received or have misplaced your operator credentials, please contact your district electoral supervisory officer.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setShowHelpModal(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col justify-between bg-slate-50 bg-tech-grid relative overflow-hidden pt-safe-top pb-safe-bottom">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-brand-300/30 via-indigo-200/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-300/20 via-sky-200/20 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation / Status Header Bar */}
      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-36 sm:w-48">
              <Image
                src="/logo-horizontal.png"
                alt="ELECTORAL-LOOKUP"
                fill
                priority
                sizes="192px"
                className="object-contain object-left"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Portal Online:</span>
              <span className="font-mono">223,789 Electors</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Command Center Intelligence & Showcase (Desktop / Tablet) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6 text-left pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Next-Gen Electoral Directory &amp; Field Operations</span>
              </div>

              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                ELECTORAL-LOOKUP OF{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600">
                  South-East &amp; Central Karnataka
                </span>{' '}
                Constituency
              </h2>

              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
                High-speed voter verification, demographic analytics, polling booth dossiers, and
                field outreach coordination engine for Karnataka Legislative Council.
              </p>
            </div>

            {/* 3 Interactive Feature Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-card-hover transition-all">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-2.5">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900">0ms Trigram Search</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Instant name, mobile, and EPIC card number resolution across full database.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-card-hover transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2.5">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900">151 Polling Booths</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Dossier printouts, coverage area maps, and WhatsApp field agent outreach.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:border-violet-300 hover:shadow-card-hover transition-all">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 mb-2.5">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900">Live Analytics</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Age pyramids, gender distribution ratios, and automated deduplication audits.
                </p>
              </div>
            </div>

            {/* Jurisdiction Coverage Matrix Strip */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-around text-center shadow-elevated">
              <div>
                <span className="text-xl font-black font-mono text-amber-400">5</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Districts</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-xl font-black font-mono text-emerald-400">30</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Constituencies</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-xl font-black font-mono text-sky-400">151</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Booths</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-xl font-black font-mono text-brand-300">223K+</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Voters</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Professional Authentication Form Card */}
          <div className="lg:col-span-5 w-full">
            <Suspense
              fallback={
                <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-10 text-center shadow-soft-xl border border-slate-200">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Initializing Portal Session...</p>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Official Bottom System Bar */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md px-4 py-3 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span>© 2026 Lalith D and Mohit J Gujjar. All Rights Reserved.</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="font-bold text-slate-700">
              ELECTORAL-LOOKUP OF South-East &amp; Central Karnataka Constituency
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-[11px]">
            <span>Authorized Election Personnel Gateway</span>
            <span>•</span>
            <span>RLS Protocol Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
