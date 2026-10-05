'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsQueryParams } from '../schema';
import { SearchFacets } from '@/features/search/types';
import { Filter, RotateCcw, RefreshCw, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface FilterBarProps {
  filters: AnalyticsQueryParams;
  activeFilterCount: number;
  lastRefreshed?: string | null;
  isRefreshing?: boolean;
  onFilterChange: (key: keyof AnalyticsQueryParams, value: string) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
}

export function FilterBar({
  filters,
  activeFilterCount,
  lastRefreshed,
  isRefreshing = false,
  onFilterChange,
  onResetFilters,
  onRefresh,
}: FilterBarProps) {
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

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'Live DB';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Live DB';
    }
  };

  // Filter ACs based on selected district
  const availableAcs = (filters.district && facets.districtAcs?.[filters.district])
    ? facets.districtAcs[filters.district]
    : (facets?.acs || []);

  const handleDistrictChange = (newDistrict: string) => {
    onFilterChange('district', newDistrict);
    // If current AC does not belong to new district, clear AC
    if (filters.ac && newDistrict && facets.districtAcs?.[newDistrict]) {
      if (!facets.districtAcs[newDistrict].includes(filters.ac)) {
        onFilterChange('ac', '');
      }
    }
  };

  const handleAcChange = (newAc: string) => {
    onFilterChange('ac', newAc);
    // Auto-select district if not set or mismatched
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

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-y border-slate-200/80 shadow-xs py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Filter Selects */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Filter By:</span>
            {activeFilterCount > 0 && (
              <Badge variant="indigo" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                {activeFilterCount}
              </Badge>
            )}
          </div>

          {/* District Select */}
          <select
            value={filters.district || ''}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs"
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
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs max-w-xs truncate"
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
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs"
          >
            <option value="">All Booths ({facets?.parts?.length || 151})</option>
            {(facets?.parts || []).map((p) => (
              <option key={p} value={p}>
                Booth {p}
              </option>
            ))}
          </select>

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

        {/* Right: Last Updated & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated:</span>
            <span className="text-slate-900 font-bold font-mono">{formatTimestamp(lastRefreshed)}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh analytics snapshot"
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
