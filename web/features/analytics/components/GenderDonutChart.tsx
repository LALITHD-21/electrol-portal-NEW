'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users2 } from 'lucide-react';
import { DashboardTotals } from '../types';
import ChartCard, { ChartTooltipShell } from '@/components/ui/ChartCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

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
  const total = totals?.total ?? 0;
  const male = totals?.male ?? 0;
  const female = totals?.female ?? 0;
  const unspecified = totals?.unspecified ?? 0;

  const malePct = total > 0 ? ((male / total) * 100).toFixed(1) : '0';
  const femalePct = total > 0 ? ((female / total) * 100).toFixed(1) : '0';
  const unspecPct = total > 0 ? ((unspecified / total) * 100).toFixed(1) : '0';
  const sexRatio = male > 0 ? Math.round((female / male) * 1000) : 0;

  const data = [
    { name: 'Male', value: male, color: GENDER_COLORS.male, pct: malePct },
    { name: 'Female', value: female, color: GENDER_COLORS.female, pct: femalePct },
    { name: 'Unspecified', value: unspecified, color: GENDER_COLORS.unspecified, pct: unspecPct },
  ].filter((d) => d.value > 0);

  const action = (
    <div className="text-right">
      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
        Sex Ratio
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full mt-0.5 shadow-2xs">
        <AnimatedNumber value={sexRatio} duration={600} />{' '}
        <span className="text-[10px] text-pink-600/80 font-normal">F/1000M</span>
      </span>
    </div>
  );

  const footer = (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl py-2 px-1 shadow-2xs transition-all hover:border-blue-300">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="w-2 h-2 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-blue-700 font-bold">Male</span>
        </div>
        <span className="text-sm font-extrabold text-blue-900 block">{malePct}%</span>
        <span className="text-[10px] text-blue-600/80 font-mono block truncate">
          <AnimatedNumber value={male} duration={800} />
        </span>
      </div>
      <div className="bg-pink-50/70 border border-pink-200/60 rounded-xl py-2 px-1 shadow-2xs transition-all hover:border-pink-300">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="w-2 h-2 rounded-sm bg-pink-500" />
          <span className="text-[10px] text-pink-700 font-bold">Female</span>
        </div>
        <span className="text-sm font-extrabold text-pink-900 block">{femalePct}%</span>
        <span className="text-[10px] text-pink-600/80 font-mono block truncate">
          <AnimatedNumber value={female} duration={800} />
        </span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-1 shadow-2xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className="w-2 h-2 rounded-sm bg-slate-400" />
          <span className="text-[10px] text-slate-600 font-bold">Other</span>
        </div>
        <span className="text-sm font-extrabold text-slate-800 block">{unspecPct}%</span>
        <span className="text-[10px] text-slate-500 font-mono block truncate">
          <AnimatedNumber value={unspecified} duration={800} />
        </span>
      </div>
    </div>
  );

  return (
    <ChartCard
      title="Gender Distribution"
      subtitle={`Verified enrolled electors`}
      icon={Users2}
      accent="pink"
      action={action}
      footer={footer}
      isLoading={isLoading}
      isEmpty={total === 0}
      dataSignature={`${total}:${male}:${female}`}
      bodyClassName="h-56"
    >
      <div className="w-full h-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <ChartTooltipShell
                      title={`${item.name} Voters`}
                      color={item.color}
                      badge={`${item.pct}%`}
                    >
                      <div className="text-slate-700 mt-1 font-mono font-medium">
                        {item.value.toLocaleString('en-IN')} electors
                      </div>
                    </ChartTooltipShell>
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
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Animated Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
            <AnimatedNumber value={total} compact={true} duration={800} />
          </span>
        </div>
      </div>
    </ChartCard>
  );
}

export default GenderDonutChart;
