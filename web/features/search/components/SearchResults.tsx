'use client';

import React from 'react';
import { SearchResultRow, SearchQueryType, BoothHeaderInfo } from '../types';
import { SearchRow } from './SearchRow';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { AnimatedItem } from '@/components/ui/AnimatedList';
import {
  AlertCircle,
  UserX,
  Clock,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface SearchResultsProps {
  results: SearchResultRow[];
  total: number;
  page: number;
  pageSize: number;
  queryType: SearchQueryType;
  durationMs: number | null;
  boothInfo?: BoothHeaderInfo | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  hasQueryOrFilter: boolean;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onRequestAddVoter?: () => void;
  onSelectElector?: (row: SearchResultRow) => void;
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
  error,
  searchQuery,
  hasQueryOrFilter,
  onPageChange,
  onReset,
  onRequestAddVoter,
  onSelectElector,
}: SearchResultsProps) {
  const { language, t } = useLanguage();
  const totalPages = Math.ceil(total / pageSize);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-3/4" />
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
    return null;
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
            {t.noVotersFound}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {language === 'kn' ? (
              <>
                ನೀವು ಹುಡುಕಿದ ವಿವರಗಳಿಗೆ ಯಾವುದೇ ಮತದಾರರ ವಿವರ ಹೊಂದಾಣಿಕೆಯಾಗಿಲ್ಲ{' '}
                {searchQuery && (
                  <strong className="text-indigo-600">&quot;{searchQuery}&quot;</strong>
                )}
                . ಅಕ್ಷರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ಬದಲಾಯಿಸಿ.
              </>
            ) : (
              <>
                No voter record matches your search query{' '}
                {searchQuery && (
                  <strong className="text-indigo-600">&quot;{searchQuery}&quot;</strong>
                )}
                . Check for spelling, enable <strong className="text-blue-700">Fuzzy Search</strong>, or adjust filters.
              </>
            )}
          </p>
        </div>

        {onRequestAddVoter && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                {t.nameNotInListTitle}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {t.nameNotInListDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestAddVoter}
              className="px-4 py-2 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs transition shadow-2xs shrink-0 self-start sm:self-auto"
            >
              {t.requestAddBtn}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
        >
          {t.clearFiltersRetry}
        </button>
      </div>
    );
  }

  // 5. Results List View
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Booth Overview Banner */}
      {boothInfo && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-soft-sm border border-indigo-800/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">
              {t.boothInfoTitle}
            </span>
            <Badge variant="indigo" size="sm" className="bg-indigo-800/80 text-indigo-200 border-indigo-600/50">
              {language === 'kn' ? `ಭಾಗ ${boothInfo.part_number}` : `Part ${boothInfo.part_number}`}
            </Badge>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>{boothInfo.polling_station_name || `Polling Booth Part ${boothInfo.part_number}`}</span>
            </h2>

            {boothInfo.polling_address && (
              <p className="text-xs text-slate-300 flex items-start gap-1.5 pt-0.5 leading-relaxed">
                <img
                  src="/location-pin.png"
                  alt="Location"
                  className="w-4 h-4 object-contain shrink-0 mt-0.5"
                />
                <span>{boothInfo.polling_address}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search Result Stats Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-slate-900 text-sm">
            {total.toLocaleString()} {t.votersFound}
          </span>
          {queryType === 'epic' && (
            <Badge variant="indigo" size="sm">
              {t.exactEpicMatch}
            </Badge>
          )}
          {queryType === 'mobile' && (
            <Badge variant="emerald" size="sm">
              {language === 'kn' ? 'ಮೊಬೈಲ್ ಹೊಂದಾಣಿಕೆ' : 'Mobile Match'}
            </Badge>
          )}
          {queryType === 'fuzzy' && (
            <Badge variant="blue" size="sm">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>{t.fuzzyMatch}</span>
            </Badge>
          )}
          {queryType === 'booth' && (
            <Badge variant="slate" size="sm">
              {language === 'kn' ? 'ಮತಗಟ್ಟೆ ಪಟ್ಟಿ' : 'Booth Roll Sequence'}
            </Badge>
          )}

          {durationMs !== null && (
            <span className="text-slate-400 font-medium inline-flex items-center gap-1 ml-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>{durationMs} ms</span>
            </span>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {results.map((row, idx) => (
          <AnimatedItem
            key={row.id}
            index={idx}
            delay={Math.min(idx * 0.02, 0.1)}
            threshold={0.15}
            className="h-full"
          >
            <SearchRow
              row={row}
              searchQuery={searchQuery}
              onSelect={onSelectElector}
            />
          </AnimatedItem>
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
