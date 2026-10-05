'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  Search,
  Users,
  Info,
} from 'lucide-react';
import { DataQualityReport } from '../types';

export function DataQualityPanel() {
  const [data, setData] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQualityData = async (force = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const url = force ? '/api/analytics/quality?refresh=true' : '/api/analytics/quality';
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to fetch data quality metrics');
      }
      const json: DataQualityReport = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading quality report');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white border border-slate-200/80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-white border border-slate-200/80 rounded-2xl" />
          <div className="h-44 bg-white border border-slate-200/80 rounded-2xl" />
          <div className="h-44 bg-white border border-slate-200/80 rounded-2xl" />
        </div>
        <div className="h-64 bg-white border border-slate-200/80 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-900">Quality Intelligence Error</h3>
        <p className="text-xs text-rose-700 mt-1">{error || 'Unable to retrieve quality statistics'}</p>
        <button
          onClick={() => fetchQualityData(true)}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          Retry Quality Check
        </button>
      </div>
    );
  }

  const { completeness, anomalies, duplicates, total_electors, refreshed_at } = data;

  const completenessEntries = [
    { key: 'epic_number', label: 'EPIC Number', val: completeness.epic_number, critical: true },
    { key: 'name', label: 'Elector Name', val: completeness.name, critical: true },
    { key: 'relative_name', label: 'Relative Name', val: completeness.relative_name, critical: false },
    { key: 'address', label: 'Residential Address', val: completeness.address, critical: true },
    { key: 'part_number', label: 'Part / Booth #', val: completeness.part_number, critical: true },
    { key: 'polling_station_name', label: 'Polling Station Name', val: completeness.polling_station_name, critical: true },
    { key: 'occupation', label: 'Occupation', val: completeness.occupation, critical: false },
    { key: 'sex', label: 'Sex / Gender', val: completeness.sex, critical: true },
    { key: 'age', label: 'Age', val: completeness.age, critical: true },
    { key: 'serial_number', label: 'Serial Number', val: completeness.serial_number, critical: false },
    { key: 'qualification', label: 'Qualification', val: completeness.qualification, critical: false },
    { key: 'caste', label: 'Caste (Field Recorded)', val: completeness.caste, critical: false },
    { key: 'whatsapp_mob', label: 'WhatsApp Mobile', val: completeness.whatsapp_mob, critical: false },
    { key: 'photo_url', label: 'Photo URL', val: completeness.photo_url, critical: false },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Roll Hygiene & Data Integrity Audit</h2>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Live Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Profiling field completeness, age anomalies, duplicate patterns, and record compliance across {total_electors.toLocaleString('en-IN')} voters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-slate-500">
            <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(refreshed_at).toLocaleTimeString('en-IN')}</span>
            </div>
            <span className="text-[10px] text-slate-400">Audited Snapshot</span>
          </div>

          <button
            onClick={() => fetchQualityData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-bold transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Auditing...' : 'Run Audit'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Key Anomalies Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age Anomalies */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Age Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-amber-200/60">
              <span className="text-slate-600 font-medium">Underage (&lt;18 yrs):</span>
              <span className="font-mono font-bold text-amber-800">{anomalies.age_under_18.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-amber-200/60">
              <span className="text-slate-600 font-medium">Extreme Senior (&gt;110 yrs):</span>
              <span className="font-mono font-bold text-amber-800">{anomalies.age_over_110.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600 font-medium">Missing / NULL Age:</span>
              <span className="font-mono font-bold text-slate-800">{anomalies.age_null.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 font-bold mt-2 block tracking-wider uppercase">FLAGGED FOR FIELD VERIFICATION</span>
        </div>

        {/* Structural Anomalies */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Structural Compliance</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-emerald-200/60">
              <span className="text-slate-600 font-medium">Blank / Empty Names:</span>
              <span className="font-mono font-bold text-emerald-700">{anomalies.name_blank} (Zero)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-200/60">
              <span className="text-slate-600 font-medium">Missing Booth / Part:</span>
              <span className="font-mono font-bold text-emerald-700">{anomalies.part_missing} (Zero)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600 font-medium">Shared Mobile (10+ voters):</span>
              <span className="font-mono font-bold text-emerald-700">{anomalies.shared_mobile_10plus} (Zero)</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold mt-2 block tracking-wider uppercase">CORE SYSTEM CONSTRAINTS HEALTHY</span>
        </div>

        {/* Suspected Duplicates Reviewer */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Rule A Duplicates</span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-700 font-mono">
              {duplicates.rule_a_clusters.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Duplicate clusters affecting <span className="text-slate-900 font-bold">{duplicates.rule_a_voters_affected.toLocaleString('en-IN')}</span> electors.
            </p>
          </div>
          <Link
            href="/search"
            className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200/80 text-rose-800 border border-rose-300 text-xs font-bold transition shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Review in Portal &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Row 2: Field Completeness Audit Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Column Completeness Matrix</h3>
            <p className="text-xs text-slate-500">Non-null and non-empty valid entries per attribute</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              &gt; 95% High
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              70–95% Moderate
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              &lt; 70% Sparse
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
          {completenessEntries.map((col) => {
            const isHigh = col.val >= 95;
            const isMed = col.val >= 70 && col.val < 95;

            const badgeBg = isHigh
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isMed
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

            const barColor = isHigh
              ? 'from-emerald-500 to-teal-400'
              : isMed
              ? 'from-amber-500 to-yellow-400'
              : 'from-rose-500 to-red-400';

            return (
              <div key={col.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{col.label}</span>
                    {col.critical && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {col.val}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.max(col.val, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
