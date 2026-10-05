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
import ChartCard, { ChartTooltipShell } from '@/components/ui/ChartCard';

interface TopDistributionChartProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  data?: DistributionItem[];
  colorTheme?: 'emerald' | 'amber' | 'indigo' | 'purple' | 'cyan' | 'rose';
  adminOnly?: boolean;
  emptyText?: string;
  isLoading?: boolean;
  maxItems?: number;
  multiColor?: boolean;
}

const MULTI_COMMUNITY_COLORS = [
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#64748b', // Slate
];

const THEME_STYLES = {
  emerald: {
    accent: 'emerald' as const,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
  },
  amber: {
    accent: 'amber' as const,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: '#f59e0b',
    gradient: 'from-amber-500 to-yellow-400',
  },
  indigo: {
    accent: 'indigo' as const,
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barColor: '#6366f1',
    gradient: 'from-indigo-500 to-purple-400',
  },
  purple: {
    accent: 'purple' as const,
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    barColor: '#8b5cf6',
    gradient: 'from-purple-500 to-fuchsia-400',
  },
  cyan: {
    accent: 'sky' as const,
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    barColor: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-400',
  },
  rose: {
    accent: 'rose' as const,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: '#ec4899',
    gradient: 'from-rose-500 to-red-400',
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
  maxItems = 6,
  multiColor = false,
}: TopDistributionChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const theme = THEME_STYLES[colorTheme];

  // Filter out missing/unrecorded entries so they never pollute categorized distribution charts
  const safeData = (Array.isArray(data) ? data : []).filter(
    (d) =>
      d &&
      d.label &&
      d.label.toLowerCase() !== 'not recorded' &&
      d.label.toLowerCase() !== 'not specified' &&
      !d.label.toLowerCase().includes('not record') &&
      d.label.toLowerCase() !== 'unknown / not recorded' &&
      d.label.toLowerCase() !== 'unknown'
  );
  const topSlice = safeData.slice(0, maxItems);
  const maxCount = Math.max(...safeData.map((d) => d.count), 1);

  const dataSig = safeData.map((d) => `${d.label}:${d.count}`).join('|') + `:${viewMode}`;

  const action = (
    <div className="flex items-center gap-1.5">
      {adminOnly && (
        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Admin Only
        </span>
      )}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setViewMode('chart')}
          className={`p-1 rounded-md transition ${
            viewMode === 'chart'
              ? 'bg-white text-brand-700 shadow-2xs'
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
              ? 'bg-white text-brand-700 shadow-2xs'
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
  );

  const footer = (
    <div className="text-[11px] text-slate-500 flex items-center justify-between">
      <span>Recorded distribution tallies</span>
      <span className="font-mono text-[10px] text-emerald-600 font-bold">100% Reconciled</span>
    </div>
  );

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      icon={Icon}
      accent={theme.accent}
      action={action}
      footer={footer}
      isLoading={isLoading}
      isEmpty={safeData.length === 0}
      emptyMessage={emptyText}
      dataSignature={dataSig}
      bodyClassName={maxItems > 6 ? 'h-72' : 'h-56'}
    >
      {viewMode === 'chart' ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={topSlice} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
              width={110}
              tickFormatter={(val) => (val.length > 15 ? `${val.slice(0, 14)}…` : val)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DistributionItem;
                  const itemIndex = topSlice.findIndex((x) => x.label === item.label);
                  const itemColor =
                    multiColor && itemIndex >= 0
                      ? MULTI_COMMUNITY_COLORS[itemIndex % MULTI_COMMUNITY_COLORS.length]
                      : theme.barColor;
                  return (
                    <ChartTooltipShell
                      title={item.label}
                      color={itemColor}
                      badge={`${item.pct}%`}
                    >
                      <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm py-0.5">
                        <span>{item.count.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-500 font-normal">voters</span>
                      </div>
                      <div className="text-[11px] font-mono text-brand-600 font-semibold">
                        {item.pct}% of cohort
                      </div>
                    </ChartTooltipShell>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill={theme.barColor}
              radius={[0, 6, 6, 0]}
              maxBarSize={20}
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {topSlice.map((entry, index) => {
                const barFill = multiColor
                  ? MULTI_COMMUNITY_COLORS[index % MULTI_COMMUNITY_COLORS.length]
                  : theme.barColor;
                const barOpacity = multiColor ? 1 : 1 - index * 0.08;
                return (
                  <Cell
                    key={`cell-${entry.label}-${index}`}
                    fill={barFill}
                    opacity={barOpacity}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {safeData.map((item, idx) => {
            const barWidth = Math.max(Math.round((item.count / maxCount) * 100), 2);
            const listBarColor = multiColor
              ? MULTI_COMMUNITY_COLORS[idx % MULTI_COMMUNITY_COLORS.length]
              : undefined;
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
                    <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-12 text-right">
                      {item.pct}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={
                      listBarColor
                        ? 'h-full rounded-full transition-all duration-500'
                        : `h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`
                    }
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: listBarColor || undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

export default TopDistributionChart;
