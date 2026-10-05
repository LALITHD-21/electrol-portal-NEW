'use client';

import React from 'react';
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
} from 'lucide-react';
import { useBooths } from '../hooks/useBooths';

interface BoothTableProps {
  districtFilter?: string;
  acFilter?: string;
}

export function BoothTable({ districtFilter = '', acFilter = '' }: BoothTableProps) {
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
      <ArrowUp className="w-3 h-3 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600" />
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Polling Booth Operations Directory</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {total} Booths
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Electors breakdown, gender ratios, mobile penetration, and direct lookup navigation
          </p>
        </div>

        {/* Search, Export CSV & PageSize controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search station or part #..."
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 sm:w-56 transition-all shadow-2xs"
            />
          </div>

          <a
            href={`/api/analytics/export?type=booths${districtFilter ? `&district=${encodeURIComponent(districtFilter)}` : ''}${acFilter ? `&ac=${encodeURIComponent(acFilter)}` : ''}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-2xs"
            title="Download Polling Booths Directory as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </a>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Items per page"
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
            <tr>
              <th
                onClick={() => handleSortChange('part_number')}
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors"
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
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Electors</span>
                  {renderSortIcon('total_electors')}
                </div>
              </th>
              <th className="py-3 px-3 text-center">Gender Split (M / F / Ratio)</th>
              <th
                onClick={() => handleSortChange('mobile_pct')}
                className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors text-right"
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
                  {/* Part Number */}
                  <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                    <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                      #{b.part_number}
                    </span>
                  </td>

                  {/* Polling Station Name & Address */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {b.polling_station_name || 'Station Not Named'}
                    </div>
                    {b.polling_address && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {b.polling_address}
                      </div>
                    )}
                  </td>

                  {/* AC & District */}
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-semibold">{b.ac_name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{b.district || '—'}</div>
                  </td>

                  {/* Total Electors */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {b.total_electors.toLocaleString('en-IN')}
                  </td>

                  {/* Gender Split */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                      <span className="text-blue-700 font-medium">M: {b.male_count}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-pink-700 font-medium">F: {b.female_count}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-700 font-bold">{b.gender_ratio} F/1000M</span>
                    </div>
                  </td>

                  {/* Mobile % */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-emerald-600 opacity-90" />
                      <span className="text-emerald-700 font-bold">{b.mobile_pct}%</span>
                      <span className="text-[10px] text-slate-400 font-normal">({b.mobile_count})</span>
                    </div>
                  </td>

                  {/* Action Links: Print Dossier + Open in Search */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/analytics/booth/${encodeURIComponent(b.part_number)}/print`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2 py-1 rounded-lg transition-all"
                        title="Print Official Booth Dossier"
                      >
                        <Printer className="w-3 h-3 text-indigo-600" />
                        <span className="hidden sm:inline">Dossier</span>
                      </Link>
                      <Link
                        href={`/search?part=${encodeURIComponent(b.part_number)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
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
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl">
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
