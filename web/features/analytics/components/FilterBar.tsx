'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsQueryParams } from '../schema';
import { SearchFacets } from '@/features/search/types';
import { Filter, RotateCcw, RefreshCw, X, SlidersHorizontal, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import LiveIndicator, { LiveStatus } from '@/components/ui/LiveIndicator';

export interface FilterBarProps {
  filters: AnalyticsQueryParams;
  activeFilterCount: number;
  lastRefreshed?: string | null;
  isRefreshing?: boolean;
  liveStatus?: LiveStatus;
  lastSyncAt?: number | null;
  onFilterChange: (key: keyof AnalyticsQueryParams, value: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
}

export function FilterBar({
  filters,
  activeFilterCount,
  lastRefreshed,
  isRefreshing = false,
  liveStatus = 'live',
  lastSyncAt,
  onFilterChange,
  onResetFilters,
  onRefresh,
}: FilterBarProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({
    districts: [],
    acs: [],
    parts: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function loadFacets() {
      try {
        const res = await fetch('/api/search/facets');
        if (res.ok) {
          const data: SearchFacets = await res.json();
          if (isMounted) setFacets(data);
        }
      } catch (err) {
        console.error('Failed to load filter facets', err);
      }
    }
    loadFacets();
    return () => {
      isMounted = false;
    };
  }, []);

  const availableAcs =
    filters.district && facets.districtAcs?.[filters.district]
      ? facets.districtAcs[filters.district]
      : facets?.acs || [];

  const handleDistrictChange = (newDistrict: string) => {
    onFilterChange('district', newDistrict);
    if (filters.ac && newDistrict && facets.districtAcs?.[newDistrict]) {
      if (!facets.districtAcs[newDistrict].includes(filters.ac)) {
        onFilterChange('ac', '');
      }
    }
  };

  const handleAcChange = (newAc: string) => {
    onFilterChange('ac', newAc);
    if (newAc && facets.districtAcs) {
      for (const [dist, acList] of Object.entries(facets.districtAcs)) {
        if (acList.includes(newAc)) {
          if (filters.district !== dist) {
            onFilterChange('district', dist);
          }
          break;
        }
      }
    }
  };

  const filterSelects = (
    <div className="space-y-4">
      {/* District Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">District</label>
        <select
          value={filters.district || ''}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500 shadow-2xs cursor-pointer"
        >
          <option value="">All Districts ({facets?.districts?.length || 5})</option>
          {(facets?.districts || []).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* AC Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">Assembly Constituency</label>
        <select
          value={filters?.ac || ''}
          onChange={(e) => handleAcChange(e.target.value)}
          className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500 shadow-2xs cursor-pointer"
        >
          <option value="">
            {filters.district
              ? `All Assemblies in ${filters.district} (${availableAcs.length})`
              : `All Assemblies (${availableAcs.length})`}
          </option>
          {availableAcs.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Part / Booth Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">Polling Booth / Part</label>
        <select
          value={filters?.part || ''}
          onChange={(e) => onFilterChange('part', e.target.value)}
          className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500 shadow-2xs cursor-pointer"
        >
          <option value="">All Booths ({facets?.parts?.length || 151})</option>
          {(facets?.parts || []).map((p) => (
            <option key={p} value={p}>
              Booth {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xs py-2 px-3 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          {/* Mobile Single Button Trigger */}
          <div className="flex sm:hidden items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 active:bg-slate-100 min-h-[44px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-600 text-white text-[10px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                aria-label="Reset filters"
                className="p-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-rose-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Filter selects */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-brand-600" />
              <span>Filters:</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="indigo"
                  size="sm"
                  className="bg-brand-50 text-brand-700 border-brand-200 font-bold"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>

            {/* District Select */}
            <select
              value={filters.district || ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer shadow-2xs"
            >
              <option value="">All Districts ({facets?.districts?.length || 5})</option>
              {(facets?.districts || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* AC Select */}
            <select
              value={filters?.ac || ''}
              onChange={(e) => handleAcChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer shadow-2xs max-w-xs truncate"
            >
              <option value="">
                {filters.district
                  ? `All Assemblies in ${filters.district} (${availableAcs.length})`
                  : `All Assemblies (${availableAcs.length})`}
              </option>
              {availableAcs.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            {/* Part / Booth Select */}
            <select
              value={filters?.part || ''}
              onChange={(e) => onFilterChange('part', e.target.value)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer shadow-2xs"
            >
              <option value="">All Booths ({facets?.parts?.length || 151})</option>
              {(facets?.parts || []).map((p) => (
                <option key={p} value={p}>
                  Booth {p}
                </option>
              ))}
            </select>

            {/* Active chips with quick dismiss */}
            {filters.district && (
              <span className="chip bg-brand-50 text-brand-700 border-brand-200">
                <span>{filters.district}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange('district', '')}
                  className="hover:opacity-75 focus:outline-none"
                  title="Remove district filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.ac && (
              <span className="chip bg-brand-50 text-brand-700 border-brand-200">
                <span>{filters.ac}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange('ac', '')}
                  className="hover:opacity-75 focus:outline-none"
                  title="Remove assembly filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.part && (
              <span className="chip bg-brand-50 text-brand-700 border-brand-200">
                <span>Booth {filters.part}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange('part', '')}
                  className="hover:opacity-75 focus:outline-none"
                  title="Remove booth filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Live indicator & Manual Refresh */}
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500 flex-shrink-0">
            <LiveIndicator status={liveStatus} lastSyncAt={lastSyncAt || lastRefreshed} />

            <button
              type="button"
              onClick={onRefresh}
              title="Refresh analytics snapshot"
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-brand-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline sm:ml-1.5">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter BottomSheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filter Analytics"
        subtitle="Narrow dashboard metrics by District, AC, and Booth"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                onResetFilters();
                setIsSheetOpen(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsSheetOpen(false)}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Apply ({activeFilterCount})
            </Button>
          </div>
        }
      >
        {filterSelects}
      </BottomSheet>
    </>
  );
}

export default FilterBar;
