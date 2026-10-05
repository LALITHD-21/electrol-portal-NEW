'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type LiveStatus = 'live' | 'syncing' | 'offline' | 'paused' | 'connecting';

interface LiveIndicatorProps {
  status: LiveStatus;
  /** ISO string or epoch ms of the last successful sync */
  lastSyncAt?: string | number | null;
  className?: string;
  compact?: boolean;
}

function relative(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const STATUS_STYLES: Record<LiveStatus, { dot: string; ping: string; text: string; bg: string; label: string }> = {
  live: {
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200/80',
    label: 'Live',
  },
  syncing: {
    dot: 'bg-indigo-500',
    ping: 'bg-indigo-400',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200/80',
    label: 'Syncing',
  },
  connecting: {
    dot: 'bg-slate-400',
    ping: 'bg-slate-300',
    text: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    label: 'Connecting',
  },
  paused: {
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200/80',
    label: 'Paused',
  },
  offline: {
    dot: 'bg-rose-500',
    ping: 'bg-rose-400',
    text: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200/80',
    label: 'Offline',
  },
};

/**
 * Pulsing live-status pill with a self-updating "Updated Ns ago" label.
 */
export function LiveIndicator({ status, lastSyncAt, className, compact = false }: LiveIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = STATUS_STYLES[status];
  const lastMs =
    lastSyncAt == null
      ? null
      : typeof lastSyncAt === 'number'
      ? lastSyncAt
      : new Date(lastSyncAt).getTime();
  const animatePing = status === 'live' || status === 'syncing';

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        s.bg,
        s.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {animatePing && (
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', s.ping)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', s.dot)} />
      </span>
      <span className="uppercase tracking-wider">{s.label}</span>
      {!compact && lastMs !== null && !Number.isNaN(lastMs) && (
        <span className="font-medium normal-case tracking-normal opacity-80 tabular">
          · {relative(now - lastMs)}
        </span>
      )}
    </span>
  );
}

export default LiveIndicator;
