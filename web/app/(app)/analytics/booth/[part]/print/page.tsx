'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Shield,
  Briefcase,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { DashboardStatsResponse } from '@/features/analytics/types';

export default function BoothPrintDossier() {
  const params = useParams();
  const router = useRouter();
  const partNumber = (params?.part as string) || '';

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [stationInfo, setStationInfo] = useState<{
    name: string;
    address: string;
    ac: string;
    district: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!partNumber) return;
      setIsLoading(true);
      try {
        // Fetch stats for this part
        const [statsRes, boothsRes] = await Promise.all([
          fetch(`/api/analytics/stats?part=${encodeURIComponent(partNumber)}`),
          fetch(`/api/analytics/booths?search=${encodeURIComponent(partNumber)}&pageSize=5`),
        ]);

        if (!statsRes.ok) throw new Error('Failed to load booth statistics');
        const statsData: DashboardStatsResponse = await statsRes.json();
        setStats(statsData);

        if (boothsRes.ok) {
          const boothsData = await boothsRes.json();
          const match = boothsData.booths?.find((b: any) => String(b.part_number) === String(partNumber)) || boothsData.booths?.[0];
          if (match) {
            setStationInfo({
              name: match.polling_station_name || 'Designated Polling Station',
              address: match.polling_address || 'Constituency Polling Location',
              ac: match.ac_name || 'Assembly Constituency',
              district: match.district || 'Karnataka District',
            });
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error preparing dossier');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [partNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-700">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold">Compiling Official Polling Booth Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-rose-200 rounded-xl p-6 max-w-md text-center shadow-lg">
          <h2 className="text-base font-bold text-rose-700">Unable to Generate Dossier</h2>
          <p className="text-xs text-slate-600 mt-2">{error || 'Booth data could not be retrieved'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            &larr; Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { totals, coverage, age_brackets, occupations, qualifications } = stats;
  const sexRatio = totals.male > 0 ? Math.round((totals.female / totals.male) * 1000) : 0;
  const youthElectors = age_brackets.find((b) => b.bracket === '18-25')?.total || 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-4 sm:px-6">
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-dossier {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden on print) */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analytics</span>
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Dossier (A4)</span>
        </button>
      </div>

      {/* Printable Sheet (Standard A4 Container) */}
      <div className="print-dossier max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-xl space-y-6">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-700">
              State of Karnataka • Electoral Operations Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Polling Booth Strategic Dossier
            </h1>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900">Part #{partNumber}</span>
              <span>•</span>
              <span>AC: {stationInfo?.ac || 'Assembly Constituency'}</span>
              <span>•</span>
              <span>District: {stationInfo?.district || 'Karnataka District'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dossier Generated</span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Polling Station Address Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{stationInfo?.name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{stationInfo?.address}</p>
          </div>
        </div>

        {/* Primary Operational KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Electors</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {totals.total.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Male Electors</span>
            <span className="text-xl font-black text-blue-900 font-mono">
              {totals.male.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {totals.total > 0 ? ((totals.male / totals.total) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <span className="text-[10px] uppercase font-bold text-pink-700 block">Female Electors</span>
            <span className="text-xl font-black text-pink-900 font-mono">
              {totals.female.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {totals.total > 0 ? ((totals.female / totals.total) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Sex Ratio</span>
            <span className="text-xl font-black text-indigo-900 font-mono">{sexRatio}</span>
            <span className="text-[10px] text-slate-500 block">F / 1000 M</span>
          </div>
        </div>

        {/* Secondary Coverage Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-slate-500 block">Mobile Penetration</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              {coverage.mobile.pct}% ({coverage.mobile.count})
            </span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-slate-500 block">Youth Electors (18-25)</span>
            <span className="text-sm font-bold text-indigo-700 font-mono">
              {youthElectors} voters
            </span>
          </div>
          <div className="border border-slate-200 rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-slate-500 block">Unspecified Gender</span>
            <span className="text-sm font-bold text-slate-700 font-mono">
              {totals.unspecified}
            </span>
          </div>
        </div>

        {/* Age Pyramid Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Age Distribution Cohorts</span>
          </h3>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3">Age Bracket</th>
                <th className="py-1.5 px-3 text-right">Male</th>
                <th className="py-1.5 px-3 text-right">Female</th>
                <th className="py-1.5 px-3 text-right">Total Electors</th>
                <th className="py-1.5 px-3 text-right">Cohort Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {age_brackets.map((b) => (
                <tr key={b.bracket}>
                  <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{b.bracket} yrs</td>
                  <td className="py-1.5 px-3 text-right text-blue-700">{b.male}</td>
                  <td className="py-1.5 px-3 text-right text-pink-700">{b.female}</td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">{b.total}</td>
                  <td className="py-1.5 px-3 text-right text-slate-600">{b.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Demographics: Top Occupations & Qualifications */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Top Normalized Professions</span>
            </h3>
            <div className="border border-slate-200 rounded-lg p-2.5 divide-y divide-slate-100 text-xs">
              {occupations.slice(0, 5).map((o, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-slate-700 truncate max-w-[70%]">{o.label}</span>
                  <span className="font-mono text-slate-900 font-semibold">{o.count} ({o.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>Top Academic Credentials</span>
            </h3>
            <div className="border border-slate-200 rounded-lg p-2.5 divide-y divide-slate-100 text-xs">
              {qualifications.slice(0, 5).map((q, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-slate-700 truncate max-w-[70%]">{q.label}</span>
                  <span className="font-mono text-slate-900 font-semibold">{q.count} ({q.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification & Sign-off Block */}
        <div className="border-t-2 border-dashed border-slate-300 pt-6 mt-6 flex items-end justify-between text-xs text-slate-600">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Field Agent / Presiding Officer</p>
            <div className="mt-8 border-b border-slate-400 w-48" />
            <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Operations Control Room</p>
            <div className="mt-8 border-b border-slate-400 w-48 ml-auto" />
            <p className="text-[10px] text-slate-500 mt-1">Authorized Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
