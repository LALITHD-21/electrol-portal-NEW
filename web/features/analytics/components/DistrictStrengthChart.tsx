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

export function DistrictStrengthChart({
  districts = [],
  selectedDistrict,
  onSelectDistrict,
  isLoading,
}: DistrictStrengthChartProps) {
  if (isLoading || !districts || districts.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse h-80 flex flex-col justify-between">
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="flex items-end justify-between gap-4 h-52 px-4 my-auto">
          {[60, 85, 45, 40, 35].map((h, i) => (
            <div
              key={i}
              className="w-16 bg-slate-100 rounded-t-xl"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const chartData = districts.map((d, index) => ({
    district: d.district,
    total: d.total,
    male: d.male,
    female: d.female,
    pct: d.pct,
    color: DISTRICT_COLORS[index % DISTRICT_COLORS.length],
  }));

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">District Voter Strength</h3>
            <p className="text-xs text-slate-500">Verified electors distribution across districts</p>
          </div>
        </div>
        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
          <Filter className="w-3 h-3" />
          Click bar to filter
        </span>
      </div>

      <div className="h-64 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="district"
              stroke="#64748b"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
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
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl text-xs z-50 min-w-[170px]">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                          {data.district}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{data.pct}%</span>
                      </div>
                      <div className="text-slate-900 font-extrabold text-sm mb-1.5">
                        {data.total.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">voters</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-700 py-0.5 font-mono">
                        <span className="font-medium font-sans">Male:</span>
                        <span>{data.male.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-pink-700 py-0.5 font-mono">
                        <span className="font-medium font-sans">Female:</span>
                        <span>{data.female.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-indigo-600 font-bold text-center">
                        Click to filter dashboard
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="total"
              radius={[8, 8, 0, 0]}
              maxBarSize={56}
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
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          {chartData.map((d) => (
            <div
              key={d.district}
              onClick={() => {
                const isSelected = selectedDistrict?.toLowerCase() === d.district.toLowerCase();
                onSelectDistrict?.(isSelected ? '' : d.district);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] font-medium text-slate-700">{d.district}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] text-slate-400 font-mono font-medium">{districts.length} Districts</span>
      </div>
    </div>
  );
}
