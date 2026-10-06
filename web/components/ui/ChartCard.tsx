'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'indigo' | 'emerald' | 'amber' | 'purple' | 'pink' | 'sky' | 'rose' | 'slate';

const ACCENTS: Record<Accent, string> = {
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  amber: 'bg-amber-50 border-amber-200 text-amber-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
  pink: 'bg-pink-50 border-pink-200 text-pink-600',
  sky: 'bg-sky-50 border-sky-200 text-sky-600',
  rose: 'bg-rose-50 border-rose-200 text-rose-600',
  slate: 'bg-slate-50 border-slate-200 text-slate-600',
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: Accent;
  /** Right-aligned header slot (badges, buttons) */
  action?: React.ReactNode;
  /** Footer slot (legend etc.) */
  footer?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Any serialisable value; when it changes the card pulses to signal fresh data */
  dataSignature?: string | number;
  /** Height class for the chart body (also used by skeleton) */
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Consistent shell for every chart: header, skeleton, empty state,
 * and a subtle pulse ring whenever the underlying data changes.
 */
export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  accent = 'indigo',
  action,
  footer,
  isLoading,
  isEmpty,
  emptyMessage = 'No data available for the current selection',
  dataSignature,
  bodyClassName = 'h-64',
  className,
  children,
  ariaLabel,
}: ChartCardProps) {
  const [pulse, setPulse] = useState(false);
  const prevSig = useRef<string | number | undefined>(dataSignature);

  useEffect(() => {
    if (dataSignature === undefined) return;
    if (prevSig.current !== undefined && prevSig.current !== dataSignature) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200);
      prevSig.current = dataSignature;
      return () => clearTimeout(t);
    }
    prevSig.current = dataSignature;
  }, [dataSignature]);

  return (
    <section
      aria-label={ariaLabel || title}
      className={cn(
        'card-interactive p-3.5 sm:p-5 flex flex-col animate-fadeIn',
        pulse && 'animate-ring-pulse',
        className
      )}
    >
      <header className="card-header">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {Icon && (
            <div className={cn('icon-chip', ACCENTS[accent])}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="card-title truncate">{title}</h3>
            {subtitle && <p className="card-subtitle truncate">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">{action}</div>}
      </header>

      <div className={cn('relative w-full', bodyClassName)}>
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col gap-3 pt-2" aria-busy="true">
            <div className="skeleton h-4 w-1/3" />
            <div className="flex-1 flex items-end gap-3 px-2">
              {[55, 80, 40, 65, 30, 72].map((h, i) => (
                <div key={i} className="skeleton flex-1 rounded-t-lg rounded-b-none" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium max-w-[220px]">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && !isLoading && !isEmpty && (
        <footer className="pt-3 mt-3 border-t border-slate-100">{footer}</footer>
      )}
    </section>
  );
}

/** Shared tooltip container for Recharts custom tooltips */
export function ChartTooltipShell({
  title,
  color,
  badge,
  children,
}: {
  title: React.ReactNode;
  color?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-elevated text-xs min-w-[170px] animate-scaleIn">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          {color && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />}
          {title}
        </span>
        {badge && <span className="text-[10px] font-mono text-slate-500">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

export default ChartCard;
