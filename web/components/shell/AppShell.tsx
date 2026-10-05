'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search,
  BarChart3,
  Sparkles,
  MoreHorizontal,
  LogOut,
  Moon,
  Sun,
  Languages,
  ShieldCheck,
  User,
  Info,
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import LiveRecordBadge from '@/components/LiveRecordBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      isActive:
        pathname.startsWith('/search') ||
        pathname === '/dashboard' ||
        pathname.startsWith('/profile'),
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      isActive: pathname.startsWith('/analytics'),
    },
  ];

  const handleConfirmedLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-slate-50/60 selection:bg-brand-500 selection:text-white">
      {/* Top Header (Collapsible on mobile, sticky with safe area) */}
      <header className="sticky top-0 z-sticky bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs pt-safe-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-2 sm:gap-4 py-1.5 sm:py-2">
            {/* Branding Logo Link - Responsive scale down on small screens without cut-off */}
            <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 min-w-0">
              <Link
                href="/search"
                className="flex items-center group transition-all duration-200 hover:scale-[1.01] flex-shrink-0"
                title="ELECTORAL-LOOKUP OF South-East & Central Karnataka Constituency"
              >
                {/* Mobile View: High-res Circular App Logo + Clean Title */}
                <div className="flex sm:hidden items-center gap-2">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src="/app-logo.png"
                      alt="ELECTORAL-LOOKUP"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-black tracking-tight text-slate-900 leading-none">
                      ELECTORAL-<span className="text-brand-600">LOOKUP</span>
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight mt-0.5">
                      Karnataka Council
                    </span>
                  </div>
                </div>

                {/* Tablet / Desktop View: Full horizontal branding banner */}
                <div className="hidden sm:flex relative sm:h-16 md:h-18 lg:h-20 sm:w-80 md:w-96 lg:w-[480px] items-center">
                  <Image
                    src="/logo-horizontal.png"
                    alt="ELECTORAL-LOOKUP OF South-East & Central Karnataka Constituency"
                    fill
                    priority
                    sizes="(max-width: 1024px) 380px, 480px"
                    className="object-contain object-left drop-shadow-2xs group-hover:drop-shadow-xs transition-all"
                  />
                </div>
              </Link>

              {/* Desktop Nav Pills */}
              <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex-shrink-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
                        item.isActive
                          ? 'bg-white text-brand-700 shadow-soft-sm font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Status Counter & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Tablet nav (when desktop nav is hidden on md screens) */}
              <nav className="hidden md:flex lg:hidden items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        item.isActive
                          ? 'bg-white text-brand-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <LiveRecordBadge />
              
              {/* Desktop Sign Out */}
              <div className="hidden sm:block">
                <LogoutButton />
              </div>

              {/* Mobile "More" Trigger in Header */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                aria-label="Open App Menu"
                className="sm:hidden p-2 text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-xl border border-slate-200/80 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Accent Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-brand-600 to-emerald-500 opacity-90" />
      </header>

      {/* Main Content Viewport (accounting for mobile bottom nav + safe areas) */}
      <main className="flex-1 flex flex-col pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-0 min-w-0 overflow-x-clip">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb zone, >=44px touch targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-bottomNav bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-elevated"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl min-h-[48px] min-w-[64px] transition-all select-none',
                item.isActive
                  ? 'text-brand-700 bg-brand-50/80 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 active:bg-slate-100'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[11px] leading-tight font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl min-h-[48px] min-w-[64px] transition-all select-none',
            isMoreOpen
              ? 'text-brand-700 bg-brand-50/80 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 active:bg-slate-100'
          )}
        >
          <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
          <span className="text-[11px] leading-tight font-medium tracking-tight">More</span>
        </button>
      </nav>

      {/* "More" Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="Portal Options"
        subtitle="Constituency Settings & Account"
      >
        <div className="space-y-3 pb-2">
          {/* Quick Info Tile */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl flex-shrink-0">
              <Image
                src="/app-logo.png"
                alt="App Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                Karnataka Legislative Council
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                South-East &amp; Central Roll Access
              </p>
            </div>
          </div>

          {/* Navigation & Action Links */}
          <div className="space-y-1">
            <Link
              href="/search"
              prefetch={true}
              onClick={() => setIsMoreOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-500" />
                <span>Search Electors</span>
              </div>
              <span className="text-xs text-slate-400 font-normal">Lookup</span>
            </Link>

            <Link
              href="/analytics"
              prefetch={true}
              onClick={() => setIsMoreOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Live Analytics</span>
              </div>
              <span className="text-xs text-slate-400 font-normal">Dashboard</span>
            </Link>

            <div className="flex items-center justify-between p-3 rounded-xl text-slate-700 text-sm font-semibold">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-slate-500" />
                <span>Language (ಭಾಷೆ)</span>
              </div>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                English / ಕನ್ನಡ
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2 border-t border-slate-100">
            {showLogoutConfirm ? (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 space-y-2.5 animate-fade-in">
                <p className="text-xs font-bold text-rose-900">
                  Are you sure you want to sign out?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    isLoading={isLoggingOut}
                    loadingText="Signing out..."
                    onClick={handleConfirmedLogout}
                  >
                    Yes, Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setShowLogoutConfirm(true)}
                leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Unified Executive Footer (desktop & tablet) */}
      <footer className="relative border-t border-slate-800 bg-slate-900 text-slate-400 py-3 text-[11px] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-medium text-slate-400 justify-center sm:justify-start">
            <span>© 2026</span>
            <span className="text-white font-bold">
              ELECTORAL-LOOKUP OF South-East &amp; Central Karnataka Constituency
            </span>
            <span className="opacity-60">• Karnataka Legislative Council Roll</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-[10px] text-slate-400 mx-auto sm:mx-0">
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>High-Speed PostgreSQL Trigram Search &amp; Real-Time Analytics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
