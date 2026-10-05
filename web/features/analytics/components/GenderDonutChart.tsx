'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardTotals } from '../types';

interface GenderDonutChartProps {
  totals: DashboardTotals;
  isLoading?: boolean;
}

const GENDER_COLORS = {
  male: '#3b82f6', // blue-500
  female: '#ec4899', // pink-500
  unspecified: '#94a3b8', // slate-400
};

export function GenderDonutChart({ totals, isLoading }: GenderDonutChartProps) {
  if (isLoading || !totals) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse h-80 flex flex-col justify-between">
        <div className="h-5 w-36 bg-slate-200 rounded-lg" />
        <div className="h-44 w-44 rounded-full border-8 border-slate-100 mx-auto" />
        <div className="h-4 w-48 bg-slate-200 rounded mx-auto" />
      </div>
    );
  }

  const { total, male, female, unspecified } = totals;
  const malePct = total > 0 ? ((male / total) * 100).toFixed(1) : '0';
  const femalePct = total > 0 ? ((female / total) * 100).toFixed(1) : '0';
  const unspecPct = total > 0 ? ((unspecified / total) * 100).toFixed(1) : '0';
  const sexRatio = male > 0 ? Math.round((female / male) * 1000) : 0;

  const data = [
    { name: 'Male', value: male, color: GENDER_COLORS.male, pct: malePct },
    { name: 'Female', value: female, color: GENDER_COLORS.female, pct: femalePct },
    { name: 'Unspecified', value: unspecified, color: GENDER_COLORS.unspecified, pct: unspecPct },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Gender Distribution</h3>
          <p className="text-xs text-slate-500">Total verified: {total.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sex Ratio</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full mt-0.5">
            {sexRatio} <span className="text-[10px] text-pink-600/80 font-normal">F/1000M</span>
          </span>
        </div>
      </div>

      <div className="h-56 w-full relative flex items-center justify-center my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-xl shadow-xl text-xs z-50">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name} Voters
                      </div>
                      <div className="text-slate-600 mt-1 font-mono font-medium">
                        {item.value.toLocaleString('en-IN')} voters ({item.pct}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
            {total >= 100000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Legend & Breakdown pills */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl py-2 px-1 shadow-2xs">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-sm bg-blue-500" />
            <span className="text-[10px] text-blue-700 font-bold">Male</span>
          </div>
          <span className="text-sm font-extrabold text-blue-900">{malePct}%</span>
          <span className="text-[10px] text-blue-600/80 font-mono block truncate">{male.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-pink-50/70 border border-pink-200/60 rounded-xl py-2 px-1 shadow-2xs">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-sm bg-pink-500" />
            <span className="text-[10px] text-pink-700 font-bold">Female</span>
          </div>
          <span className="text-sm font-extrabold text-pink-900">{femalePct}%</span>
          <span className="text-[10px] text-pink-600/80 font-mono block truncate">{female.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-1 shadow-2xs">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-sm bg-slate-400" />
            <span className="text-[10px] text-slate-600 font-bold">Other</span>
          </div>
          <span className="text-sm font-extrabold text-slate-800">{unspecPct}%</span>
          <span className="text-[10px] text-slate-500 font-mono block truncate">{unspecified.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
