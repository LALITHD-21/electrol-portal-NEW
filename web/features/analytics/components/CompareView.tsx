'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRightLeft,
  Users,
  Building2,
  Phone,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { CompareResponse } from '../types';

export function CompareView() {
  const [type, setType] = useState<'district' | 'ac'>('district');
  const [itemA, setItemA] = useState<string>('Chikkaballapura');
  const [itemB, setItemB] = useState<string>('Tumkur');
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const districtOptions = ['Chikkaballapura', 'Tumkur', 'Chitradurga', 'Davanagere', 'Kolar'];
  const acOptions = ['Gauribidanur', 'Pavagada', 'Harihar', 'Molakalmuru', 'Srinivaspur'];

  const options = type === 'district' ? districtOptions : acOptions;

  const runComparison = async (curType: 'district' | 'ac', a: string, b: string) => {
    if (!a || !b) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/compare?type=${curType}&itemA=${encodeURIComponent(a)}&itemB=${encodeURIComponent(b)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to compare');
      }
      const data: CompareResponse = await res.json();
      setComparison(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const firstA = type === 'district' ? 'Chikkaballapura' : 'Gauribidanur';
    const firstB = type === 'district' ? 'Tumkur' : 'Pavagada';
    setItemA(firstA);
    setItemB(firstB);
    runComparison(type, firstA, firstB);
  }, [type]);

  const handleSwap = () => {
    const prevA = itemA;
    const prevB = itemB;
    setItemA(prevB);
    setItemB(prevA);
    runComparison(type, prevB, prevA);
  };

  const aStats = comparison?.itemA.stats;
  const bStats = comparison?.itemB.stats;

  const aSexRatio = aStats && aStats.totals.male > 0 ? Math.round((aStats.totals.female / aStats.totals.male) * 1000) : 0;
  const bSexRatio = bStats && bStats.totals.male > 0 ? Math.round((bStats.totals.female / bStats.totals.male) * 1000) : 0;

  const aYouth = aStats?.age_brackets.find((b) => b.bracket === '18-25')?.pct || 0;
  const bYouth = bStats?.age_brackets.find((b) => b.bracket === '18-25')?.pct || 0;

  return (
    <div className="space-y-6">
      {/* Control Selector Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Constituency & Territory Compare Mode</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side electoral profiling, demographics, and voter density comparisons.
          </p>
        </div>

        {/* Comparison Type Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setType('district')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              type === 'district' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Districts
          </button>
          <button
            onClick={() => setType('ac')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              type === 'ac' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assemblies (AC)
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-blue-700 block mb-1">
            Cohort A ({type.toUpperCase()}):
          </label>
          <select
            value={itemA}
            onChange={(e) => {
              setItemA(e.target.value);
              runComparison(type, e.target.value, itemB);
            }}
            className="w-full px-3 py-2 bg-blue-50/40 border border-blue-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          >
            {options.map((opt) => (
              <option key={`a-${opt}`} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwap}
          title="Swap Cohorts"
          className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80 transition flex-shrink-0 mt-3 sm:mt-0 shadow-2xs"
        >
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
        </button>

        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase font-bold text-pink-700 block mb-1">
            Cohort B ({type.toUpperCase()}):
          </label>
          <select
            value={itemB}
            onChange={(e) => {
              setItemB(e.target.value);
              runComparison(type, itemA, e.target.value);
            }}
            className="w-full px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 shadow-2xs"
          >
            {options.map((opt) => (
              <option key={`b-${opt}`} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-96 bg-white border border-slate-200/80 rounded-2xl" />
          <div className="h-96 bg-white border border-slate-200/80 rounded-2xl" />
        </div>
      ) : aStats && bStats ? (
        <div className="space-y-6">
          {/* Key Metrics Comparison Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50/60 font-bold">
                  <th className="py-3 px-4">Strategic Metric</th>
                  <th className="py-3 px-4 text-right font-bold text-blue-700">{itemA}</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-400">Comparison</th>
                  <th className="py-3 px-4 text-right font-bold text-pink-700">{itemB}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Total Electors */}
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-800 font-sans font-medium flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Total Verified Electors
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {aStats.totals.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-500">
                    {aStats.totals.total > bStats.totals.total ? `+${(aStats.totals.total - bStats.totals.total).toLocaleString('en-IN')} in A` : `+${(bStats.totals.total - aStats.totals.total).toLocaleString('en-IN')} in B`}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {bStats.totals.total.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* Polling Booths */}
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-800 font-sans font-medium flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Polling Booths Count
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    {aStats.hierarchy.booths}
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    {bStats.hierarchy.booths}
                  </td>
                </tr>

                {/* Sex Ratio */}
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-800 font-sans font-medium">
                    Gender Ratio (F / 1000 M)
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${aSexRatio >= bSexRatio ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {aSexRatio}
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-500">
                    Δ {Math.abs(aSexRatio - bSexRatio)}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${bSexRatio >= aSexRatio ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {bSexRatio}
                  </td>
                </tr>

                {/* Mobile Penetration */}
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-800 font-sans font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Mobile Reach (%)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    {aStats.coverage.mobile.pct}%
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    {bStats.coverage.mobile.pct}%
                  </td>
                </tr>

                {/* Youth Cohort */}
                <tr className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-800 font-sans font-medium">
                    Youth Electors (18–25 yrs)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700">
                    {aYouth}%
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-bold text-pink-700">
                    {bYouth}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Side-by-side Top Demographic Cohorts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cohort A Top Lists */}
            <div className="bg-white border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="text-sm font-bold text-blue-900">{itemA} Top Demographics</span>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                  Cohort A
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Top Normalized Occupations</span>
                </div>
                <div className="space-y-1.5">
                  {aStats.occupations.slice(0, 4).map((o, i) => (
                    <div key={`a-occ-${i}`} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700 truncate max-w-[70%] font-medium">{o.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{o.count.toLocaleString('en-IN')} ({o.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Top Qualifications</span>
                </div>
                <div className="space-y-1.5">
                  {aStats.qualifications.slice(0, 4).map((q, i) => (
                    <div key={`a-qual-${i}`} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700 truncate max-w-[70%] font-medium">{q.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{q.count.toLocaleString('en-IN')} ({q.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cohort B Top Lists */}
            <div className="bg-white border border-pink-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                <span className="text-sm font-bold text-pink-900">{itemB} Top Demographics</span>
                <span className="text-[10px] font-mono bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full font-bold">
                  Cohort B
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Top Normalized Occupations</span>
                </div>
                <div className="space-y-1.5">
                  {bStats.occupations.slice(0, 4).map((o, i) => (
                    <div key={`b-occ-${i}`} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700 truncate max-w-[70%] font-medium">{o.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{o.count.toLocaleString('en-IN')} ({o.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Top Qualifications</span>
                </div>
                <div className="space-y-1.5">
                  {bStats.qualifications.slice(0, 4).map((q, i) => (
                    <div key={`b-qual-${i}`} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700 truncate max-w-[70%] font-medium">{q.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{q.count.toLocaleString('en-IN')} ({q.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
