'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { SearchFiltersState, SearchFacets } from '../types';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

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
  const [isOpen, setIsOpen] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({
    districts: [],
    acs: [],
    parts: [],
  });
  const [isLoadingFacets, setIsLoadingFacets] = useState(false);

  // Count active filters
  const activeCount = Object.values(filters).filter(Boolean).length;

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

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Filter Header Toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Advanced Constituency &amp; Booth Filters</span>
          {activeCount > 0 && (
            <Badge variant="indigo" size="sm">
              {activeCount} Active
            </Badge>
          )}
          {isOpen ? (
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

      {/* Collapsible Content */}
      {isOpen && (
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
              htmlFor="filter-village"
              className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
            >
              Village / Ward
            </label>
            <input
              id="filter-village"
              type="text"
              value={filters.village || ''}
              onChange={(e) => onFilterChange('village', e.target.value)}
              placeholder="e.g. Kyathsandra"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
