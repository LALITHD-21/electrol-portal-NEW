'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, BarChart3, Sparkles } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import LiveRecordBadge from '@/components/LiveRecordBadge';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      isActive: pathname.startsWith('/search') || pathname === '/dashboard',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      isActive: pathname.startsWith('/analytics'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Executive Shell Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Left: Branding Emblem Logo */}
            <div className="flex items-center gap-6">
              <Link
                href="/search"
                className="flex items-center group transition-transform duration-200 hover:scale-[1.01] flex-shrink-0"
              >
                <div className="relative h-10 sm:h-12 w-48 sm:w-64 flex items-center">
                  <Image
                    src="/logo-horizontal.png"
                    alt="ELECTROL-LOOKUP Portal"
                    fill
                    priority
                    className="object-contain object-left"
                  />
                </div>
              </Link>

              {/* Center Navigation Tabs: Search | Analytics */}
              <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                        item.isActive
                          ? 'bg-white text-indigo-700 shadow-soft-sm font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Live Database Counter & User Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <LiveRecordBadge />
              <LogoutButton />
            </div>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition',
                    item.isActive
                      ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                      : 'text-slate-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-90" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Compact Watermark Footer */}
      <footer className="relative border-t border-slate-800 bg-slate-900 text-slate-400 py-3 text-[11px] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-medium text-slate-400 justify-center sm:justify-start">
            <span>© 2026</span>
            <span className="text-white font-bold">Internal Voter Operations Portal</span>
            <span className="opacity-60">• Karnataka Electoral Roll Data</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-[10px] text-slate-400 mx-auto sm:mx-0">
            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
            <span>High-Speed PostgreSQL Trigram Search</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
