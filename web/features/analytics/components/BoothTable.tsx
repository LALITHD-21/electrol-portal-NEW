'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Phone,
  Users,
  Download,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { useBooths } from '../hooks/useBooths';
import { BoothTableRow } from '../types';
import { GenerateReportModal } from '@/components/reports/GenerateReportModal';

interface BoothTableProps {
  districtFilter?: string;
  acFilter?: string;
}

export function BoothTable({ districtFilter = '', acFilter = '' }: BoothTableProps) {
  const [selectedBoothForReport, setSelectedBoothForReport] = useState<BoothTableRow | null>(null);
  const [isAllBoothsReportOpen, setIsAllBoothsReportOpen] = useState<boolean>(false);

  const {
    booths,
    total,
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    isLoading,
    totalPages,
    handleSearchChange,
    handleSortChange,
    handlePageChange,
    setPageSize,
  } = useBooths(districtFilter, acFilter);

  const renderSortIcon = (col: string) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-600" />
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-card-hover transition-all min-w-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
            <h3 className="text-base font-bold text-slate-900 truncate">
              Polling Booth Operations Directory
            </h3>
            <span className="text-xs bg-brand-50 text-brand-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-brand-200 flex-shrink-0">
              {total} Booths
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Electors breakdown, gender ratios, mobile penetration, and direct lookup navigation
          </p>
        </div>

        {/* Search, Export CSV & PageSize controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search station or part #..."
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[16px] sm:text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-full sm:w-56 transition-all shadow-2xs min-h-[44px] sm:min-h-0"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAllBoothsReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-2xs min-h-[44px] sm:min-h-0 cursor-pointer"
            title="Generate Reports / Export Directory (PDF & Excel)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reports &amp; Export</span>
          </button>

          <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Items per page"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 shadow-2xs min-h-[44px] sm:min-h-0"
            >
              <option value={10}>10/page</option>
              <option value={20}>20/page</option>
              <option value={50}>50/page</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MOBILE CARD VIEW (<640px) ── */}
      <div className="block sm:hidden space-y-3">
        {isLoading ? (
          [...Array(pageSize > 5 ? 5 : pageSize)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))
        ) : booths.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No polling booths found</p>
          </div>
        ) : (
          booths.map((b, idx) => (
            <div
              key={`${b.part_number}-${idx}`}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg inline-block mb-1">
                    Part #{b.part_number}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                    {b.polling_station_name || 'Station Not Named'}
                  </h4>
                  {b.polling_address && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {b.polling_address}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-black text-base text-slate-900 block">
                    {b.total_electors.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Voters</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono pt-1 border-t border-slate-100">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                  M: {b.male_count}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-semibold">
                  F: {b.female_count}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{b.mobile_pct}%</span>
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-sans">
                  {b.ac_name}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBoothForReport(b)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 active:bg-slate-100 min-h-[40px] cursor-pointer"
                  title="Generate Reports (PDF / Excel)"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-600" />
                  <span>Dossier</span>
                </button>
                <Link
                  href={`/search?part=${encodeURIComponent(b.part_number)}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 active:bg-brand-100 min-h-[40px]"
                >
                  <span>View Voters</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP TABLE VIEW (sm+) ── */}
      <div className="hidden sm:block overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
            <tr>
              <th
                onClick={() => handleSortChange('part_number')}
                className="py-3 px-3 cursor-pointer hover:text-brand-600 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Part #</span>
                  {renderSortIcon('part_number')}
                </div>
              </th>
              <th className="py-3 px-3">Polling Station & Address</th>
              <th className="py-3 px-3">AC / District</th>
              <th
                onClick={() => handleSortChange('total_electors')}
                className="py-3 px-3 cursor-pointer hover:text-brand-600 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Electors</span>
                  {renderSortIcon('total_electors')}
                </div>
              </th>
              <th className="py-3 px-3 text-center">Gender Split (M / F / Ratio)</th>
              <th
                onClick={() => handleSortChange('mobile_pct')}
                className="py-3 px-3 cursor-pointer hover:text-brand-600 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Mobile %</span>
                  {renderSortIcon('mobile_pct')}
                </div>
              </th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(pageSize > 10 ? 10 : pageSize)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-3"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-48 bg-slate-200 rounded mb-1" /><div className="h-3 w-32 bg-slate-100 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-32 bg-slate-200 rounded mx-auto" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-4 w-28 bg-slate-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : booths.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-600">No polling booths found matching your query</p>
                  <p className="text-xs mt-1">Try adjusting your filters or search keywords</p>
                </td>
              </tr>
            ) : (
              booths.map((b, idx) => (
                <tr
                  key={`${b.part_number}-${b.district || ''}-${b.ac_name || ''}-${idx}`}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-brand-700">
                    <span className="bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg text-xs">
                      #{b.part_number}
                    </span>
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                      {b.polling_station_name || 'Station Not Named'}
                    </div>
                    {b.polling_address && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {b.polling_address}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-semibold">{b.ac_name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{b.district || '—'}</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {b.total_electors.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                      <span className="text-blue-700 font-medium">M: {b.male_count}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-pink-700 font-medium">F: {b.female_count}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-700 font-bold">{b.gender_ratio} F/1000M</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-emerald-600 opacity-90" />
                      <span className="text-emerald-700 font-bold">{b.mobile_pct}%</span>
                      <span className="text-[10px] text-slate-400 font-normal">({b.mobile_count})</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBoothForReport(b)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                        title="Generate Reports (PDF / Excel)"
                      >
                        <Printer className="w-3 h-3 text-brand-600" />
                        <span className="hidden sm:inline">Dossier</span>
                      </button>
                      <Link
                        href={`/search?part=${encodeURIComponent(b.part_number)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-lg transition-all"
                      >
                        <span>Voters</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="text-slate-800 font-bold">
            {total === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="text-slate-800 font-bold">
            {Math.min(page * pageSize, total)}
          </span>{' '}
          of <span className="text-slate-800 font-bold">{total}</span> booths
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-2 sm:p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl">
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-2 sm:p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generate Reports Modal for Selected Polling Booth */}
      {selectedBoothForReport && (
        <GenerateReportModal
          isOpen={!!selectedBoothForReport}
          onClose={() => setSelectedBoothForReport(null)}
          booth={selectedBoothForReport}
        />
      )}

      {/* Generate Reports Modal for Full Operations Directory */}
      {isAllBoothsReportOpen && (
        <GenerateReportModal
          isOpen={isAllBoothsReportOpen}
          onClose={() => setIsAllBoothsReportOpen(false)}
          isAllBooths={true}
          allBooths={booths}
          totalElectors={total}
        />
      )}
    </div>
  );
}

export default BoothTable;
