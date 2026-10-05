'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users2 } from 'lucide-react';
import { AgeBracketNode } from '../types';

interface AgePyramidChartProps {
  brackets?: AgeBracketNode[];
  isLoading?: boolean;
}

const AGE_COLORS: Record<string, string> = {
  '18-25': '#0ea5e9', // Sky Blue
  '26-35': '#10b981', // Emerald Green
  '36-45': '#14b8a6', // Teal
  '46-60': '#f59e0b', // Amber / Gold
  '61-80': '#f43f5e', // Rose / Red
  '80+': '#ec4899',   // Hot Pink
  'unknown': '#94a3b8', // Slate
};

export function AgePyramidChart({ brackets = [], isLoading }: AgePyramidChartProps) {
  const [viewMode, setViewMode] = useState<'total' | 'split'>('total');

  if (isLoading || !brackets || brackets.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse h-80 flex flex-col justify-between">
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="flex items-end justify-between gap-3 h-52 px-4 my-auto">
          {[45, 80, 55, 30, 15].map((h, i) => (
            <div
              key={i}
              className="w-12 bg-slate-100 rounded-t-xl"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Format bracket labels for clean display
  const chartData = brackets.map((b) => ({
    name: b.bracket === 'unknown' ? 'Unknown' : `${b.bracket}`,
    bracketKey: b.bracket,
    male: b.male,
    female: b.female,
    total: b.total,
    pct: b.pct,
    color: AGE_COLORS[b.bracket] || '#6366f1',
  }));

  // Calculate young electors (18-25)
  const youth18to25 = brackets.find((b) => b.bracket === '18-25')?.total || 0;
  const totalElectors = brackets.reduce((acc, curr) => acc + curr.total, 0);
  const youthPct = totalElectors > 0 ? ((youth18to25 / totalElectors) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200">
            <Users2 className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Age Demographics</h3>
            <p className="text-xs text-slate-500">Voters grouped by generational brackets</p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setViewMode('total')}
            className={`px-2 py-1 rounded-md transition ${
              viewMode === 'total'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 rounded-md transition ${
              viewMode === 'split'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            M / F
          </button>
        </div>
      </div>

      <div className="h-56 w-full my-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl text-xs z-50 min-w-[150px]">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {label} yrs
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{item.pct}%</span>
                      </div>
                      <div className="text-slate-900 font-extrabold text-sm mb-1.5">
                        {item.total.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">electors</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-700 py-0.5 font-mono">
                        <span className="font-medium font-sans">Male:</span>
                        <span>{item.male.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-pink-700 py-0.5 font-mono">
                        <span className="font-medium font-sans">Female:</span>
                        <span>{item.female.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {viewMode === 'total' ? (
              <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={44}>
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.bracketKey}`} fill={entry.color} />
                ))}
              </Bar>
            ) : (
              <>
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="female" name="Female" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-500 pt-2 flex items-center justify-between border-t border-slate-100">
        <span className="flex items-center gap-1">
          Youth (18–25): <strong className="text-emerald-700 font-mono">{youth18to25.toLocaleString('en-IN')} ({youthPct}%)</strong>
        </span>
        <span className="text-slate-600 font-mono font-medium">7 Cohorts</span>
      </div>
    </div>
  );
}
