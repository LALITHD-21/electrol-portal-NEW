'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { SearchFiltersState, SearchFacets } from '../types';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

export interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFilterChange: (key: keyof SearchFiltersState, value: string) => void;
  onClearFilters: () => void;
}

export function SearchFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({
    districts: [],
    acs: [],
    parts: [],
  });
  const [isLoadingFacets, setIsLoadingFacets] = useState(false);

  // Count active filters (excluding fuzzy)
  const activeCount = ['district', 'ac', 'part', 'village'].reduce((acc, key) => {
    return filters[key as keyof SearchFiltersState] ? acc + 1 : acc;
  }, 0);

  useEffect(() => {
    let isMounted = true;
    async function loadFacets() {
      setIsLoadingFacets(true);
      try {
        const res = await fetch('/api/search/facets');
        if (res.ok) {
          const data: SearchFacets = await res.json();
          if (isMounted) setFacets(data);
        }
      } catch (err) {
        console.error('Failed to load facets:', err);
      } finally {
        if (isMounted) setIsLoadingFacets(false);
      }
    }
    loadFacets();
    return () => {
      isMounted = false;
    };
  }, []);

  const filterFields = (
    <div className="space-y-4">
      {/* District Select */}
      <Select
        label="District"
        placeholder="All Districts"
        value={filters.district || ''}
        onChange={(e) => onFilterChange('district', e.target.value)}
        disabled={isLoadingFacets}
        options={facets.districts.map((d) => ({ value: d, label: d }))}
      />

      {/* Assembly Constituency Select */}
      <Select
        label="Assembly Constituency (AC)"
        placeholder="All ACs"
        value={filters.ac || ''}
        onChange={(e) => onFilterChange('ac', e.target.value)}
        disabled={isLoadingFacets}
        options={facets.acs.map((a) => ({ value: a, label: a }))}
      />

      {/* Part / Booth Number Select */}
      <Select
        label="Part / Booth Number"
        placeholder="All Booths"
        value={filters.part || ''}
        onChange={(e) => onFilterChange('part', e.target.value)}
        disabled={isLoadingFacets}
        options={facets.parts.map((p) => ({
          value: p,
          label: `Part ${p}`,
        }))}
      />

      {/* Village / Ward Input */}
      <div className="space-y-1.5 w-full">
        <label
          htmlFor="filter-village"
          className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Village / Ward / Area
        </label>
        <input
          id="filter-village"
          type="text"
          value={filters.village || ''}
          onChange={(e) => onFilterChange('village', e.target.value)}
          placeholder="e.g. Kyathsandra"
          className="w-full min-h-[48px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[16px] sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition shadow-2xs"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-2">
      {/* Mobile Trigger Bar: BottomSheet Opener on <640px */}
      <div className="sm:hidden flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 active:bg-slate-50 min-h-[44px]"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Constituency &amp; Booth Filters</span>
          </div>
          {activeCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-bold">
              {activeCount}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-normal">All</span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            aria-label="Reset all filters"
            className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-rose-100"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile Active Filter Chips (Removable) */}
      {activeCount > 0 && (
        <div className="sm:hidden flex flex-wrap items-center gap-1.5 pt-1">
          {filters.district && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span>Dist: {filters.district}</span>
              <button
                type="button"
                onClick={() => onFilterChange('district', '')}
                className="p-0.5 rounded-full hover:bg-brand-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.ac && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span>AC: {filters.ac}</span>
              <button
                type="button"
                onClick={() => onFilterChange('ac', '')}
                className="p-0.5 rounded-full hover:bg-brand-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.part && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span>Part: {filters.part}</span>
              <button
                type="button"
                onClick={() => onFilterChange('part', '')}
                className="p-0.5 rounded-full hover:bg-brand-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.village && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <span>Ward: {filters.village}</span>
              <button
                type="button"
                onClick={() => onFilterChange('village', '')}
                className="p-0.5 rounded-full hover:bg-brand-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet for Filters */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filter Electoral Roll"
        subtitle="Narrow by District, AC, Booth Part, and Village"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                onClearFilters();
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
              Apply ({activeCount})
            </Button>
          </div>
        }
      >
        {filterFields}
      </BottomSheet>

      {/* Desktop / Tablet Collapsible Filter Card */}
      <div className="hidden sm:block w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-brand-600 transition"
          >
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            <span>Advanced Constituency &amp; Booth Filters</span>
            {activeCount > 0 && (
              <Badge variant="indigo" size="sm">
                {activeCount} Active
              </Badge>
            )}
            {isDesktopExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {isDesktopExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            {/* District Select */}
            <Select
              label="District"
              placeholder="All Districts"
              value={filters.district || ''}
              onChange={(e) => onFilterChange('district', e.target.value)}
              disabled={isLoadingFacets}
              options={facets.districts.map((d) => ({ value: d, label: d }))}
            />

            {/* Assembly Constituency Select */}
            <Select
              label="Assembly Constituency (AC)"
              placeholder="All ACs"
              value={filters.ac || ''}
              onChange={(e) => onFilterChange('ac', e.target.value)}
              disabled={isLoadingFacets}
              options={facets.acs.map((a) => ({ value: a, label: a }))}
            />

            {/* Part / Booth Number Select */}
            <Select
              label="Part / Booth Number"
              placeholder="All Booths"
              value={filters.part || ''}
              onChange={(e) => onFilterChange('part', e.target.value)}
              disabled={isLoadingFacets}
              options={facets.parts.map((p) => ({
                value: p,
                label: `Part ${p}`,
              }))}
            />

            {/* Village / Ward Input */}
            <div className="space-y-1.5 w-full">
              <label
                htmlFor="desktop-filter-village"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
              >
                Village / Ward
              </label>
              <input
                id="desktop-filter-village"
                type="text"
                value={filters.village || ''}
                onChange={(e) => onFilterChange('village', e.target.value)}
                placeholder="e.g. Kyathsandra"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
