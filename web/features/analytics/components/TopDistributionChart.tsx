'use client';

import React, { useState } from 'react';
import { LucideIcon, BarChart2, List } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DistributionItem } from '../types';

interface TopDistributionChartProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  data?: DistributionItem[];
  colorTheme?: 'emerald' | 'amber' | 'indigo' | 'purple' | 'cyan' | 'rose';
  adminOnly?: boolean;
  emptyText?: string;
  isLoading?: boolean;
}

const THEME_STYLES = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: '#f59e0b',
    gradient: 'from-amber-500 to-yellow-400',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barColor: '#6366f1',
    gradient: 'from-indigo-500 to-purple-400',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    barColor: '#8b5cf6',
    gradient: 'from-purple-500 to-fuchsia-400',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 border-purple-200',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    barColor: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-400',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 border-cyan-200',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: '#ec4899',
    gradient: 'from-rose-500 to-red-400',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200',
  },
};

export function TopDistributionChart({
  title,
  subtitle,
  icon: Icon,
  data = [],
  colorTheme = 'indigo',
  adminOnly = false,
  emptyText = 'No recorded distribution data available',
  isLoading = false,
}: TopDistributionChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const theme = THEME_STYLES[colorTheme];

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse h-80 flex flex-col justify-between">
        <div className="h-5 w-44 bg-slate-200 rounded-lg" />
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const topSlice = safeData.slice(0, 6);
  const maxCount = Math.max(...safeData.map((d) => d.count), 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${theme.iconBg}`}>
            <Icon className={`w-4 h-4 ${theme.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              {adminOnly && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Admin Only
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`p-1 rounded-md transition ${
                viewMode === 'chart'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Bar Chart View"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
            {data.length}
          </span>
        </div>
      </div>

      {/* Content */}
      {safeData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400">
          <p className="text-xs">{emptyText}</p>
        </div>
      ) : viewMode === 'chart' ? (
        <div className="h-56 w-full my-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topSlice}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#475569"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                width={80}
                tickFormatter={(val) => (val.length > 11 ? `${val.slice(0, 10)}…` : val)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DistributionItem;
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-xl text-xs z-50 min-w-[130px]">
                        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                          {item.label}
                        </div>
                        <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm py-0.5">
                          <span>{item.count.toLocaleString('en-IN')}</span>
                          <span className="text-xs text-slate-500 font-normal">voters</span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                          {item.pct}% of cohort
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill={theme.barColor} radius={[0, 6, 6, 0]} maxBarSize={20}>
                {topSlice.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={theme.barColor}
                    opacity={1 - index * 0.08}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-2 my-2 max-h-56 overflow-y-auto pr-1">
          {safeData.map((item, idx) => {
            const barWidth = Math.max(Math.round((item.count / maxCount) * 100), 2);
            return (
              <div key={`${item.label}-${idx}`} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <span className="text-[10px] font-mono text-slate-400 w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800 font-bold text-xs">
                      {item.count.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 w-12 text-right">
                      {item.pct}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span>Includes recorded & unrecorded tallies</span>
        <span className="font-mono text-[10px] text-emerald-600 font-bold">100% Reconciled</span>
      </div>
    </div>
  );
}
