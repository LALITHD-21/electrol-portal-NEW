'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/search';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setError(data.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }

      window.location.href = redirectPath;
    } catch (err: any) {
      setError('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scaleIn my-6">
      {/* Outer Card Glass Styling */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-soft-xl border border-white/80 p-7 sm:p-9 space-y-6 text-center">

        {/* Emblem Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
            {/* Glowing Backdrop Ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/20 via-orange-400/20 to-emerald-500/20 blur-lg animate-pulseGlow" />
            
            <Image
              src="/logo-emblem.png"
              alt="ELECTROL-LOQKUP Emblem Logo"
              fill
              priority
              className="object-contain relative z-10 drop-shadow-md"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Elector Portal
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Sign in with authorized system credentials
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 p-3.5 text-xs sm:text-sm text-rose-700 bg-rose-50/90 border border-rose-200/80 rounded-2xl animate-slideDown shadow-xs text-left"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left" noValidate>
          {/* Username Field */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="Enter username (e.g. admin)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 shadow-md shadow-indigo-500/25 hover:shadow-lg focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to System</span>
              </>
            )}
          </button>
        </form>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-100/50 via-purple-100/30 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-10 text-center shadow-soft-xl">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading Portal...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
