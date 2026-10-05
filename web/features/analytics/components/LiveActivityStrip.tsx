'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Zap, Users, TrendingUp } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import LiveIndicator, { LiveStatus } from '@/components/ui/LiveIndicator';
import type { LiveDataResponse, DashboardTotals } from '../types';

interface LiveActivityStripProps {
  liveData: LiveDataResponse | null;
  liveStatus: LiveStatus;
  lastSyncAt: number | null;
  totals?: DashboardTotals;
  isLoading?: boolean;
}

export function LiveActivityStrip({
  liveData,
  liveStatus,
  lastSyncAt,
  totals,
  isLoading,
}: LiveActivityStripProps) {
  const buckets = liveData?.buckets || [];
  const addedCount = liveData?.addedLastWindow ?? 0;
  const totalCount = totals?.total ?? liveData?.total ?? null;
  const maleCount = totals?.male ?? null;
  const femaleCount = totals?.female ?? null;

  return (
    <div className="card p-3.5 sm:p-4 bg-gradient-to-r from-white via-indigo-50/20 to-white border border-slate-200/90 shadow-2xs rounded-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Top / Left: Status & Telemetry Header */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-600 flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Live Roll Stream
                </span>
                <LiveIndicator status={liveStatus} lastSyncAt={lastSyncAt} compact={true} />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                Continuous real-time telemetry reconciliation
              </p>
            </div>
          </div>

          {/* Quick pulse pill for mobile */}
          <div className="sm:hidden flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span>{addedCount > 0 ? `+${addedCount}` : 'Steady'}</span>
            </span>
          </div>
        </div>

        {/* Center / Metrics: Clean 2-column grid on mobile, inline flex on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6">
          {/* Metric 1: Verified Total */}
          <div className="p-2.5 sm:p-0 rounded-xl bg-slate-50/80 sm:bg-transparent border border-slate-100 sm:border-0 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200/60 sm:bg-transparent flex items-center justify-center text-slate-600 flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Total Enrolled</div>
              <div className="text-sm sm:text-base font-black text-slate-900 font-mono leading-tight">
                {isLoading && totalCount === null ? (
                  <span className="text-slate-400">...</span>
                ) : (
                  <AnimatedNumber value={totalCount} duration={800} />
                )}
              </div>
            </div>
          </div>

          {/* Metric 2: Added in last 30 min */}
          <div className="p-2.5 sm:p-0 rounded-xl bg-emerald-50/60 sm:bg-transparent border border-emerald-100 sm:border-0 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 sm:bg-transparent flex items-center justify-center text-emerald-600 flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700 leading-tight">
                Added (30 min)
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-700 font-mono leading-tight flex items-center gap-0.5">
                +<AnimatedNumber value={addedCount} duration={600} />
              </div>
            </div>
          </div>

          {/* Metric 3: Gender Split Mini (Desktop only) */}
          {maleCount !== null && femaleCount !== null && (
            <div className="hidden xl:flex items-center gap-3 text-xs font-mono pl-2 border-l border-slate-200">
              <div className="flex items-center gap-1 text-blue-700">
                <span className="font-bold">M:</span>
                <AnimatedNumber value={maleCount} compact={true} />
              </div>
              <div className="flex items-center gap-1 text-pink-700">
                <span className="font-bold">F:</span>
                <AnimatedNumber value={femaleCount} compact={true} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Sparkline of last 30 minutes activity (Shown on tablet/desktop, or on mobile only if addedCount > 0) */}
        <div className={`items-center gap-3 self-stretch lg:self-auto min-w-[200px] sm:min-w-[240px] h-10 ${addedCount > 0 ? 'flex' : 'hidden sm:flex'}`}>
          <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-400 font-medium flex-shrink-0">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>30-min Pulse</span>
            </span>
            <span className="font-mono text-slate-500">
              {addedCount > 0 ? `${addedCount} new` : 'Steady state'}
            </span>
          </div>

          <div className="flex-1 h-full rounded-xl bg-slate-50/80 border border-slate-200/70 p-1 relative overflow-hidden">
            {buckets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buckets} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="livePulseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const timeStr = new Date(item.t).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md font-mono">
                            {timeStr}: {item.count} rows
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#livePulseGrad)"
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-400">
                Steady state
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveActivityStrip;
