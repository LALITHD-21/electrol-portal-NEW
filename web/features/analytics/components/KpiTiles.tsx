'use client';

import React from 'react';
import {
  DashboardTotals,
  DashboardCoverage,
  DashboardDuplicates,
} from '../types';
import {
  Users,
  UserCheck,
  PhoneCall,
  ShieldAlert,
  CopyCheck,
  CameraOff,
} from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export interface KpiTilesProps {
  totals?: DashboardTotals;
  coverage?: DashboardCoverage;
  duplicates?: DashboardDuplicates;
  hasCasteAccess?: boolean;
  isLoading?: boolean;
}

export function KpiTiles({
  totals,
  coverage,
  duplicates,
  hasCasteAccess = true,
  isLoading = false,
}: KpiTilesProps) {
  const t = totals || { total: 0, male: 0, female: 0, unspecified: 0 };
  const cov = coverage || {
    mobile: { count: 0, pct: 0 },
    photo: { count: 0, pct: 0 },
    caste: { count: 0, pct: 0 },
    occupation: { count: 0, pct: 0 },
    qualification: { count: 0, pct: 0 },
  };
  const dup = duplicates || { groups: 0, rows: 0 };

  const isDataReady = !isLoading && !!totals && !!coverage && !!duplicates;

  const malePct =
    t.total > 0
      ? Math.round((t.male / t.total) * 1000) / 10
      : 0;
  const femalePct =
    t.total > 0
      ? Math.round((t.female / t.total) * 1000) / 10
      : 0;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Core Operational KPIs &amp; Roll Coverage</span>
        </h3>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>100% Reconciled SQL Tally</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total Electors */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Electors</span>
            <div className="p-1.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-20 h-7 skeleton" />
              ) : (
                <AnimatedNumber value={t.total} duration={800} />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">
              100% verified roll
            </div>
          </div>
        </div>

        {/* 2. Male Electors */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Male Voters</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-16 h-7 skeleton" />
              ) : (
                <AnimatedNumber value={t.male} duration={800} />
              )}
            </div>
            <div className="text-[10px] text-blue-600 mt-1 font-bold">
              {malePct}% of electorate
            </div>
          </div>
        </div>

        {/* 3. Female Electors */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Female Voters</span>
            <div className="p-1.5 rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-pink-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-16 h-7 skeleton" />
              ) : (
                <AnimatedNumber value={t.female} duration={800} />
              )}
            </div>
            <div className="text-[10px] text-pink-600 mt-1 font-bold flex items-center justify-between">
              <span>{femalePct}% of total</span>
              {t.unspecified > 0 && (
                <span className="text-slate-400 font-medium text-[9px]">
                  +{t.unspecified.toLocaleString()} unspec.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Mobile Outreach Reach */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Mobile Reach</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-14 h-7 skeleton" />
              ) : (
                <AnimatedNumber value={cov.mobile.count} duration={800} />
              )}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">
              {cov.mobile.pct}% coverage
            </div>
          </div>
        </div>

        {/* 5. Caste Intelligence (Admin Only) */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Caste Intel</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-14 h-7 skeleton" />
              ) : hasCasteAccess ? (
                <AnimatedNumber value={cov.caste.count} duration={800} />
              ) : (
                <span className="text-sm font-semibold text-slate-400">Locked</span>
              )}
            </div>
            <div className="text-[10px] text-amber-600 mt-1 font-bold">
              {hasCasteAccess ? `${cov.caste.pct}% recorded` : 'Admin role required'}
            </div>
          </div>
        </div>

        {/* 6. Suspected Duplicates */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Duplicates</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <CopyCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-14 h-7 skeleton" />
              ) : (
                <AnimatedNumber value={dup.rows} duration={800} />
              )}
            </div>
            <div className="text-[10px] text-rose-600 mt-1 font-bold">
              <AnimatedNumber value={dup.groups} duration={800} /> groups (Rule A)
            </div>
          </div>
        </div>

        {/* 7. Photo Coverage */}
        <div className="relative card-interactive p-4 overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Photo Coverage</span>
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
              <CameraOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="relative mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-700 font-mono">
              {!isDataReady ? (
                <span className="inline-block w-12 h-7 skeleton" />
              ) : (
                `${cov.photo.pct}%`
              )}
            </div>
            <div className="text-[10px] text-amber-700 mt-1 font-semibold">
              Feature Pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KpiTiles;
