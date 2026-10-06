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
import { cn } from '@/lib/utils';

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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <span className="text-[10px] text-brand-700 font-bold bg-brand-50 border border-brand-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-2xs whitespace-nowrap">
      <Filter className="w-3 h-3 text-brand-600" />
      <span className="hidden sm:inline">Click bar to filter</span>
      <span className="sm:hidden">Tap to filter</span>
    </span>
  );

  const renderCustomTick = (props: any) => {
    const { x, y, payload } = props;
    const value = payload?.value || '';
    const isSelected = selectedDistrict?.toLowerCase() === value.toLowerCase();

    if (isMobile) {
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={8}
            dx={-4}
            textAnchor="end"
            fill={isSelected ? '#0f172a' : '#64748b'}
            transform="rotate(-28)"
            fontSize={10}
            fontWeight={isSelected ? 700 : 600}
            className="select-none"
          >
            {value}
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill={isSelected ? '#0f172a' : '#64748b'}
          fontSize={11}
          fontWeight={isSelected ? 700 : 600}
          className="select-none"
        >
          {value}
        </text>
      </g>
    );
  };

  const footer = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {chartData.map((d) => {
          const isSelected = selectedDistrict?.toLowerCase() === d.district.toLowerCase();
          return (
            <button
              key={d.district}
              type="button"
              onClick={() => {
                onSelectDistrict?.(isSelected ? '' : d.district);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all select-none border cursor-pointer',
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:border-slate-300'
              )}
              title={`Filter by ${d.district}`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span>{d.district}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-slate-400 font-medium">
        {selectedDistrict && (
          <button
            type="button"
            onClick={() => onSelectDistrict?.('')}
            className="text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-2"
          >
            Clear filter
          </button>
        )}
        <span className="font-mono whitespace-nowrap">
          {districts.length} Districts
        </span>
      </div>
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
      bodyClassName={isMobile ? 'h-72' : 'h-64'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 15,
            right: 10,
            left: -10,
            bottom: isMobile ? 12 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="district"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            height={isMobile ? 50 : 28}
            tick={renderCustomTick}
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
                      {isMobile ? 'Tap bar to filter' : 'Click to toggle filter'}
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
