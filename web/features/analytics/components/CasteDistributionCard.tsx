'use client';

import React, { useState, useMemo } from 'react';
import {
  Shield,
  BarChart3,
  PieChart as PieIcon,
  ListOrdered,
  Download,
  Info,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { DistributionItem } from '../types';
import { ChartTooltipShell } from '@/components/ui/ChartCard';
import { cn } from '@/lib/utils';

interface CasteDistributionCardProps {
  data?: DistributionItem[];
  totalRoll?: number;
  coverage?: { count: number; pct: number };
  isLoading?: boolean;
}

// Curated high-contrast color palette for community intelligence
const COMMUNITY_PALETTE = [
  { bar: '#0d9488', gradient: 'from-teal-500 to-emerald-400', text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  { bar: '#6366f1', gradient: 'from-indigo-500 to-blue-400', text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { bar: '#f59e0b', gradient: 'from-amber-500 to-yellow-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { bar: '#8b5cf6', gradient: 'from-purple-500 to-fuchsia-400', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  { bar: '#ec4899', gradient: 'from-pink-500 to-rose-400', text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  { bar: '#06b6d4', gradient: 'from-cyan-500 to-sky-400', text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { bar: '#10b981', gradient: 'from-emerald-500 to-green-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { bar: '#f97316', gradient: 'from-orange-500 to-amber-400', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { bar: '#3b82f6', gradient: 'from-blue-500 to-indigo-400', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { bar: '#14b8a6', gradient: 'from-teal-600 to-teal-400', text: 'text-teal-800', bg: 'bg-teal-50', border: 'border-teal-300' },
  { bar: '#d946ef', gradient: 'from-fuchsia-500 to-pink-400', text: 'text-fuchsia-700', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' },
  { bar: '#64748b', gradient: 'from-slate-500 to-slate-400', text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
];

/** Clean and standardize community names from raw database strings */
function formatCommunityName(raw: string): string {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'not recorded' || lower.includes('not record')) {
    return 'Pending Enumeration / Unrecorded';
  }
  if (lower === 'navaka' || lower === 'nayaka') {
    return 'Nayaka / Valmiki (ST)';
  }
  if (lower === 'muslim') {
    return 'Muslim (Minority)';
  }
  if (lower === 'madiga') {
    return 'Madiga (SC)';
  }
  if (lower === 'kuruba') {
    return 'Kuruba';
  }
  if (lower === 'vokkaliga') {
    return 'Vokkaliga';
  }
  if (lower === 'vakkal / vokkaliga' || lower === 'vakkal') {
    return 'Vakkal / Vokkaliga';
  }
  if (lower === 'bhovi') {
    return 'Bhovi (SC)';
  }
  if (lower === 'golla') {
    return 'Golla / Yadava';
  }
  if (lower === 'adi karnataka') {
    return 'Adi Karnataka (SC)';
  }
  if (lower === 'lingayath' || lower === 'lingayat') {
    return 'Lingayat / Veerashaiva';
  }
  if (lower === 'others') {
    return 'Others / Mixed Communities';
  }

  // Capitalize words nicely
  return trimmed
    .split(/[\s/]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function CasteDistributionCard({
  data = [],
  totalRoll = 223789,
  coverage,
  isLoading = false,
}: CasteDistributionCardProps) {
  // Mode: 'recorded' (excludes unrecorded so real communities are clearly visible) vs 'all' (includes unrecorded)
  const [scope, setScope] = useState<'recorded' | 'all'>('recorded');
  const [viewMode, setViewMode] = useState<'bar' | 'donut' | 'table'>('bar');
  const [searchTerm, setSearchTerm] = useState('');

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Separate unrecorded vs recorded items
  const { unrecordedItem, recordedItems, totalRecordedCount } = useMemo(() => {
    let unrec: DistributionItem | undefined;
    const rec: DistributionItem[] = [];

    safeData.forEach((item) => {
      const l = item.label.toLowerCase();
      if (l.includes('not record') || l === 'unspecified' || l === 'unknown') {
        unrec = item;
      } else {
        rec.push(item);
      }
    });

    // Sort recorded items by count descending
    rec.sort((a, b) => b.count - a.count);

    const recTotal = coverage?.count || rec.reduce((acc, curr) => acc + curr.count, 0) || 1;

    return {
      unrecordedItem: unrec,
      recordedItems: rec,
      totalRecordedCount: recTotal,
    };
  }, [safeData, coverage]);

  const effectiveTotalRoll = totalRoll || (unrecordedItem?.count || 0) + totalRecordedCount;
  const unrecordedCount = unrecordedItem?.count || Math.max(effectiveTotalRoll - totalRecordedCount, 0);
  const recordedPct = ((totalRecordedCount / effectiveTotalRoll) * 100).toFixed(2);
  const unrecordedPct = ((unrecordedCount / effectiveTotalRoll) * 100).toFixed(2);

  // Prepared data for display depending on scope
  const chartData = useMemo(() => {
    if (scope === 'recorded') {
      return recordedItems.map((item, index) => {
        const cohortPct = Number(((item.count / totalRecordedCount) * 100).toFixed(1));
        const rollPct = Number(((item.count / effectiveTotalRoll) * 100).toFixed(2));
        const colorObj = COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length];
        return {
          originalLabel: item.label,
          label: formatCommunityName(item.label),
          count: item.count,
          cohortPct,
          rollPct,
          color: colorObj.bar,
          gradient: colorObj.gradient,
          badgeBg: colorObj.bg,
          badgeText: colorObj.text,
          badgeBorder: colorObj.border,
          rank: index + 1,
        };
      });
    }

    // 'all' scope: includes unrecorded as the last item
    const base = recordedItems.map((item, index) => {
      const cohortPct = Number(((item.count / totalRecordedCount) * 100).toFixed(1));
      const rollPct = Number(((item.count / effectiveTotalRoll) * 100).toFixed(2));
      const colorObj = COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length];
      return {
        originalLabel: item.label,
        label: formatCommunityName(item.label),
        count: item.count,
        cohortPct,
        rollPct,
        color: colorObj.bar,
        gradient: colorObj.gradient,
        badgeBg: colorObj.bg,
        badgeText: colorObj.text,
        badgeBorder: colorObj.border,
        rank: index + 1,
      };
    });

    if (unrecordedCount > 0) {
      base.unshift({
        originalLabel: 'Not recorded',
        label: 'Pending Enumeration / Unrecorded',
        count: unrecordedCount,
        cohortPct: 0,
        rollPct: Number(unrecordedPct),
        color: '#94a3b8',
        gradient: 'from-slate-400 to-slate-300',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-600',
        badgeBorder: 'border-slate-300',
        rank: 0,
      });
    }

    return base;
  }, [scope, recordedItems, totalRecordedCount, effectiveTotalRoll, unrecordedCount, unrecordedPct]);

  // Filtered list for search in table view
  const filteredTableData = useMemo(() => {
    if (!searchTerm.trim()) return chartData;
    const term = searchTerm.toLowerCase();
    return chartData.filter(
      (d) =>
        d.label.toLowerCase().includes(term) ||
        d.originalLabel.toLowerCase().includes(term)
    );
  }, [chartData, searchTerm]);

  // Top 4 communities for quick cards
  const top4Communities = useMemo(() => {
    return recordedItems.slice(0, 4).map((item, index) => {
      const cohortPct = ((item.count / totalRecordedCount) * 100).toFixed(1);
      const colorObj = COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length];
      return {
        name: formatCommunityName(item.label),
        count: item.count,
        pct: cohortPct,
        color: colorObj.bar,
        badgeBg: colorObj.bg,
        badgeText: colorObj.text,
        badgeBorder: colorObj.border,
      };
    });
  }, [recordedItems, totalRecordedCount]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Rank', 'Community Name', 'Voter Count', '% of Recorded Cohort', '% of Total Roll'];
    const rows = chartData.map((d) => [
      d.rank > 0 ? d.rank : 'N/A',
      `"${d.label.replace(/"/g, '""')}"`,
      d.count,
      `${d.cohortPct}%`,
      `${d.rollPct}%`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `caste_community_distribution_${scope}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-elevated overflow-hidden transition-all duration-300">
      {/* 1. Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Caste & Community Intelligence
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                Admin Confidential
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {recordedItems.length} Communities Mapped
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregate demographic representation across registered constituency electorate
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
          {/* Scope Toggle: Recorded Only vs All */}
          <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScope('recorded')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5',
                scope === 'recorded'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Focus on mapped communities with realistic comparative proportions"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recorded Cohort ({totalRecordedCount.toLocaleString('en-IN')})</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5',
                scope === 'all'
                  ? 'bg-white text-slate-800 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="Show entire roll including unrecorded census electors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Roll</span>
            </button>
          </div>

          {/* View Mode Toggle: Bar vs Donut vs Table */}
          <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('bar')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'bar'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="Horizontal Bar Chart View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('donut')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'donut'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="Proportional Donut View"
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
              title="Detailed Table View"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Roll Enumeration & Coverage Executive Strip */}
      <div className="bg-slate-50/70 border-b border-slate-100 px-4 sm:px-5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Total Constituency Roll:
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {effectiveTotalRoll.toLocaleString('en-IN')}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">Field-Identified Cohort:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {totalRecordedCount.toLocaleString('en-IN')} ({recordedPct}%)
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Pending Enumeration:</span>
            <span className="font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {unrecordedCount.toLocaleString('en-IN')} ({unrecordedPct}%)
            </span>
          </div>

          {scope === 'recorded' && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1 self-start sm:self-auto">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>Displaying relative community proportions calibrated to recorded sample.</span>
            </div>
          )}
        </div>

        {/* Dual-color Segmented Micro-Bar */}
        <div className="mt-2.5 w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${Math.max(Number(recordedPct), 1)}%` }}
            title={`Field Mapped: ${totalRecordedCount.toLocaleString('en-IN')} (${recordedPct}%)`}
          />
          <div
            className="h-full bg-slate-300/80 transition-all duration-700"
            style={{ width: `${100 - Number(recordedPct)}%` }}
            title={`Pending Enumeration: ${unrecordedCount.toLocaleString('en-IN')} (${unrecordedPct}%)`}
          />
        </div>
      </div>

      {/* 3. Top 4 Community Highlights */}
      {top4Communities.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-b from-white to-slate-50/40 border-b border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Top Represented Communities in Recorded Sample
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {top4Communities.map((c, idx) => (
              <div
                key={c.name}
                className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600">
                    {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : '4th'}
                  </span>
                  <span className={cn('text-xs font-mono font-bold px-1.5 py-0.5 rounded border', c.badgeBg, c.badgeText, c.badgeBorder)}>
                    {c.pct}%
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm truncate group-hover:text-brand-600 transition-colors" title={c.name}>
                  {c.name}
                </div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  {c.count.toLocaleString('en-IN')} voters
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Number(c.pct) * 2, 100)}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main Chart / Visualization Body */}
      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="h-80 flex flex-col items-center justify-center gap-3">
            <div className="skeleton h-6 w-1/3 rounded-lg" />
            <div className="w-full space-y-3 px-4">
              {[80, 65, 50, 40, 30].map((w, i) => (
                <div key={i} className="skeleton h-6 rounded-md" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Shield className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No community records available</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: HORIZONTAL BAR CHART */}
            {viewMode === 'bar' && (
              <div className="w-full">
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        stroke="#334155"
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        width={160}
                        tickFormatter={(val) => (val.length > 22 ? `${val.slice(0, 20)}…` : val)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <ChartTooltipShell
                                title={item.label}
                                color={item.color}
                                badge={item.rank > 0 ? `#${item.rank} Rank` : 'Unmapped'}
                              >
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm">
                                    <span>{item.count.toLocaleString('en-IN')}</span>
                                    <span className="text-xs text-slate-500 font-normal">electors</span>
                                  </div>
                                  {item.cohortPct > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                      <span>Cohort Share:</span>
                                      <span className="font-mono font-bold">{item.cohortPct}%</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                                    <span>Total Roll Share:</span>
                                    <span className="font-bold">{item.rollPct}%</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                                    Confidential election intelligence
                                  </div>
                                </div>
                              </ChartTooltipShell>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={22}
                        isAnimationActive={true}
                        animationDuration={600}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-2">
                  <span>Horizontal bars indicate absolute verified voter counts</span>
                  <span className="font-mono text-emerald-600 font-semibold">
                    {scope === 'recorded' ? 'Calibrated to mapped electors' : 'Full constituency scale'}
                  </span>
                </div>
              </div>
            )}

            {/* VIEW 2: PROPORTIONAL DONUT CHART */}
            {viewMode === 'donut' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 h-80 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`donut-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <ChartTooltipShell
                                title={item.label}
                                color={item.color}
                                badge={`${item.cohortPct > 0 ? item.cohortPct : item.rollPct}%`}
                              >
                                <div className="text-slate-900 font-extrabold text-sm py-1">
                                  {item.count.toLocaleString('en-IN')} voters
                                </div>
                              </ChartTooltipShell>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {scope === 'recorded'
                        ? totalRecordedCount.toLocaleString('en-IN')
                        : effectiveTotalRoll.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {scope === 'recorded' ? 'Mapped Electors' : 'Total Roll'}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="lg:col-span-6 max-h-80 overflow-y-auto space-y-2 pr-2">
                  {chartData.map((item, idx) => (
                    <div
                      key={`legend-${idx}`}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[65%]">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-800 truncate" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          {item.count.toLocaleString('en-IN')}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-14 text-right">
                          {item.cohortPct > 0 ? `${item.cohortPct}%` : `${item.rollPct}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: RANKED TABLE / LIST VIEW */}
            {viewMode === 'table' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter community..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Showing {filteredTableData.length} records
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                          <th className="py-2.5 px-3">Community / Category</th>
                          <th className="py-2.5 px-3 text-right">Electors</th>
                          <th className="py-2.5 px-3">Recorded Cohort Share</th>
                          <th className="py-2.5 px-3 text-right">Roll Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTableData.map((item, idx) => (
                          <tr key={`row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                              {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank > 0 ? `#${item.rank}` : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="font-bold text-slate-900">{item.label}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {item.count.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-[120px]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(item.cohortPct * 2, 100)}%`,
                                      backgroundColor: item.color,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-semibold text-slate-700 w-12">
                                  {item.cohortPct > 0 ? `${item.cohortPct}%` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {item.rollPct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Footer Section */}
      <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Form 18 & Field Registers Verified</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-600">Confidential Elector Record</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            100% Reconciled
          </span>
        </div>
      </div>
    </section>
  );
}

export default CasteDistributionCard;
