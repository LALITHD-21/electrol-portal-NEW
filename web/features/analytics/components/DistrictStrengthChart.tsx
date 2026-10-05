'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Filter, BarChart3 } from 'lucide-react';
import { DistrictStrengthNode } from '../types';
import ChartCard, { ChartTooltipShell } from '@/components/ui/ChartCard';

interface DistrictStrengthChartProps {
  districts?: DistrictStrengthNode[];
  selectedDistrict?: string;
  onSelectDistrict?: (district: string) => void;
  isLoading?: boolean;
}

const DISTRICT_COLORS = [
  '#10b981', // Emerald (Tumkur)
  '#3b82f6', // Blue (Chitradurga)
  '#f59e0b', // Amber (Kolar)
  '#8b5cf6', // Purple (Davanagere)
  '#ec4899', // Pink (Chikkaballapura)
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const DISTRICT_COLOR_MAP: Record<string, string> = {
  tumkur: '#10b981',
  chitradurga: '#3b82f6',
  kolar: '#f59e0b',
  davanagere: '#8b5cf6',
  chikkaballapura: '#ec4899',
  chikkaballapur: '#ec4899',
};

export function DistrictStrengthChart({
  districts = [],
  selectedDistrict,
  onSelectDistrict,
  isLoading,
}: DistrictStrengthChartProps) {
  const chartData = (districts || []).map((d, index) => ({
    district: d.district,
    total: d.total,
    male: d.male,
    female: d.female,
    pct: d.pct,
    color:
      DISTRICT_COLOR_MAP[d.district.toLowerCase()] ||
      DISTRICT_COLORS[index % DISTRICT_COLORS.length],
  }));

  const dataSig = (districts || []).map((d) => `${d.district}:${d.total}`).join('|');

  const action = (
    <span className="text-[10px] text-brand-700 font-bold bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
      <Filter className="w-3 h-3" />
      <span>Click bar to filter</span>
    </span>
  );

  const footer = (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <div className="flex items-center gap-3 flex-wrap">
        {chartData.map((d) => (
          <button
            key={d.district}
            type="button"
            onClick={() => {
              const isSelected = selectedDistrict?.toLowerCase() === d.district.toLowerCase();
              onSelectDistrict?.(isSelected ? '' : d.district);
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition group focus-ring rounded-md px-1 py-0.5"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] font-semibold text-slate-700 group-hover:text-slate-900">
              {d.district}
            </span>
          </button>
        ))}
      </div>
      <span className="text-[11px] text-slate-400 font-mono font-medium whitespace-nowrap">
        {districts.length} Districts
      </span>
    </div>
  );

  return (
    <ChartCard
      title="District Voter Strength"
      subtitle="Verified electors distribution across administrative districts"
      icon={BarChart3}
      accent="emerald"
      action={action}
      footer={footer}
      isLoading={isLoading}
      isEmpty={chartData.length === 0}
      dataSignature={dataSig}
      bodyClassName="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="district"
            stroke="#64748b"
            fontSize={11}
            fontWeight={600}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={0}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <ChartTooltipShell
                    title={data.district}
                    color={data.color}
                    badge={`${data.pct}%`}
                  >
                    <div className="text-slate-900 font-extrabold text-sm mb-1.5">
                      {data.total.toLocaleString('en-IN')}{' '}
                      <span className="text-xs text-slate-500 font-normal">voters</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-700 py-0.5 font-mono">
                      <span className="font-medium font-sans">Male:</span>
                      <span>{data.male.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-pink-700 py-0.5 font-mono">
                      <span className="font-medium font-sans">Female:</span>
                      <span>{data.female.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-brand-600 font-bold text-center">
                      Click to toggle filter
                    </div>
                  </ChartTooltipShell>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="total"
            radius={[8, 8, 0, 0]}
            maxBarSize={56}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
            onClick={(entry: any) => {
              const distName = entry?.payload?.district || entry?.district || '';
              if (!distName) return;
              const isSelected = selectedDistrict?.toLowerCase() === distName.toLowerCase();
              onSelectDistrict?.(isSelected ? '' : distName);
            }}
            className="cursor-pointer"
          >
            {chartData.map((entry) => {
              const isSelected = selectedDistrict?.toLowerCase() === entry.district.toLowerCase();
              return (
                <Cell
                  key={`cell-${entry.district}`}
                  fill={entry.color}
                  opacity={selectedDistrict && !isSelected ? 0.35 : 1}
                  stroke={isSelected ? '#1e293b' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default DistrictStrengthChart;
