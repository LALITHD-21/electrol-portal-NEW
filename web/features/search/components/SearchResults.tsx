'use client';

import React from 'react';
import { SearchResultRow, SearchQueryType, BoothHeaderInfo } from '../types';
import { SearchRow } from './SearchRow';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  UserX,
  Clock,
  Database,
  Download,
  Loader2,
  Building2,
  MapPin,
  Sparkles,
} from 'lucide-react';

export interface SearchResultsProps {
  results: SearchResultRow[];
  total: number;
  page: number;
  pageSize: number;
  queryType: SearchQueryType;
  durationMs: number | null;
  boothInfo?: BoothHeaderInfo | null;
  isLoading: boolean;
  isExporting?: boolean;
  error: string | null;
  searchQuery: string;
  hasQueryOrFilter: boolean;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onExportCsv?: () => void;
}

export function SearchResults({
  results,
  total,
  page,
  pageSize,
  queryType,
  durationMs,
  boothInfo,
  isLoading,
  isExporting = false,
  error,
  searchQuery,
  hasQueryOrFilter,
  onPageChange,
  onReset,
  onExportCsv,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-soft-sm max-w-lg mx-auto animate-scaleIn">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Search Error</h3>
          <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-xs"
        >
          Reset Search
        </button>
      </div>
    );
  }

  // 3. Not searched yet (initial idle state)
  if (!hasQueryOrFilter) {
    return (
      <div className="bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-3 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-800">
            Search Across 223,789 Verified Voters
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Enter an EPIC card number, 10-digit mobile number, or elector name to find records instantly.
          </p>
        </div>
      </div>
    );
  }

  // 4. Empty State (Searched but 0 results)
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-soft-sm max-w-md mx-auto animate-fadeIn">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400">
          <UserX className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">
            No Voters Found
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            No voter record matches your search query{' '}
            {searchQuery && (
              <strong className="text-indigo-600">"{searchQuery}"</strong>
            )}
            . Check for spelling, enable <strong className="text-amber-700">Fuzzy Search</strong>, or adjust filters.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
        >
          Clear Filters &amp; Retry
        </button>
      </div>
    );
  }

  // 5. Results List View
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Booth Overview Banner (Shown when browsing or filtering by a specific Part) */}
      {boothInfo && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-soft-sm border border-indigo-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">
              Official Polling Station Information
            </span>
            <Badge variant="indigo" size="sm" className="bg-indigo-800/80 text-indigo-200 border-indigo-600/50">
              Part {boothInfo.part_number}
            </Badge>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>{boothInfo.polling_station_name || `Polling Booth Part ${boothInfo.part_number}`}</span>
            </h2>

            {boothInfo.polling_address && (
              <p className="text-xs text-slate-300 flex items-start gap-1.5 pt-0.5 leading-relaxed">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{boothInfo.polling_address}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search Result Stats Header & CSV Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-slate-900 text-sm">
            {total.toLocaleString()} Voters Found
          </span>
          {queryType === 'epic' && (
            <Badge variant="indigo" size="sm">
              Exact EPIC Match
            </Badge>
          )}
          {queryType === 'mobile' && (
            <Badge variant="emerald" size="sm">
              Mobile Match
            </Badge>
          )}
          {queryType === 'fuzzy' && (
            <Badge variant="amber" size="sm">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Fuzzy / Transliteration Match</span>
            </Badge>
          )}
          {queryType === 'booth' && (
            <Badge variant="slate" size="sm">
              Booth Roll Sequence
            </Badge>
          )}

          {durationMs !== null && (
            <span className="text-slate-400 font-medium inline-flex items-center gap-1 ml-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>{durationMs} ms</span>
            </span>
          )}
        </div>

        {/* CSV Export Action Button */}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isExporting || total === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Page to CSV</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Row List */}
      <div className="space-y-2.5">
        {results.map((row) => (
          <SearchRow key={row.id} row={row} searchQuery={searchQuery} />
        ))}
      </div>

      {/* Keyset / Offset Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
