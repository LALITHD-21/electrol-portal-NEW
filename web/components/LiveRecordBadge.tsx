'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function LiveRecordBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isVisibleRef = useRef<boolean>(true);

  const abortCtrlRef = useRef<AbortController | null>(null);

  const fetchLiveCount = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortCtrlRef.current = abortCtrl;

    try {
      const url = manual ? `/api/stats?manual=1&t=${Date.now()}` : '/api/stats';
      const res = await fetch(url, { signal: abortCtrl.signal });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === 'number') {
          setCount(data.count);
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'AbortError') {
        console.error('Failed to fetch live electors count', e);
      }
    } finally {
      setIsLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLiveCount();

    const handleVisibility = () => {
      isVisibleRef.current = typeof document !== 'undefined' ? !document.hidden : true;
      if (isVisibleRef.current) fetchLiveCount();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // Auto-refresh live count every 30 seconds when tab is active (reduced from 5s to eliminate server congestion)
    const interval = setInterval(() => {
      if (isVisibleRef.current) {
        fetchLiveCount();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, []);

  return (
    <div
      onClick={() => fetchLiveCount(true)}
      title="Click to refresh live record count from database"
      className="inline-flex items-center gap-1.5 sm:gap-2.5 px-2 py-1 sm:px-3.5 sm:py-2 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-card-hover transition-all duration-300 cursor-pointer group animate-fadeIn flex-shrink-0 select-none"
    >
      {/* Dual Radar Pulsing Beacon */}
      <div className="relative flex items-center justify-center w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-xs" />
      </div>

      {/* Database Icon & Live Counter */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold tracking-wide">
        <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="epic-mono font-extrabold text-slate-900 text-xs sm:text-sm">
          {isLoading && count === null ? (
            '...'
          ) : (
            <AnimatedNumber value={count} duration={800} />
          )}
        </span>
        <span className="hidden sm:inline text-slate-600 font-extrabold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
          Indexed
        </span>
      </div>

      {/* Manual Refresh Spinner */}
      <RefreshCw
        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 group-hover:text-brand-600 transition flex-shrink-0 ${
          isRefreshing ? 'animate-spin text-brand-600' : ''
        }`}
      />
    </div>
  );
}
