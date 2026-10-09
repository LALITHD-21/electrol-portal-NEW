'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { SearchFiltersState, SearchFacets } from '../types';
import { Select } from '@/components/ui/Select';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFilterChange: (key: keyof SearchFiltersState, value: string) => void;
  onClearFilters: () => void;
}

const CANONICAL_DISTRICTS = [
  'All places',
  'Tumkur',
  'Chitradurga',
  'Davanagere',
  'Kolar',
  'Chikkaballapura',
];

export function SearchFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [facets, setFacets] = useState<SearchFacets>({
    districts: [],
    acs: [],
    parts: [],
  });
  const [isLoadingFacets, setIsLoadingFacets] = useState(false);
  const { language, t } = useLanguage();

  const getDistrictLabel = (d: string) => {
    if (language !== 'kn') return d;
    switch (d.toLowerCase()) {
      case 'all places':
        return t.allPlaces;
      case 'tumkur':
        return t.tumkur;
      case 'chitradurga':
        return t.chitradurga;
      case 'davanagere':
        return t.davanagere;
      case 'kolar':
        return t.kolar;
      case 'chikkaballapura':
        return t.chikkaballapura;
      default:
        return d;
    }
  };

  // Count active filters (excluding fuzzy)
  const activeCount = ['district', 'taluk', 'ac', 'part', 'village'].reduce((acc, key) => {
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

  const districtList = useMemo(() => {
    const list = [...CANONICAL_DISTRICTS];
    if (facets.districts && facets.districts.length > 0) {
      facets.districts.forEach((d) => {
        if (!list.includes(d)) {
          list.push(d);
        }
      });
    }
    return list;
  }, [facets.districts]);

  // District Pills Component matching User Reference
  const renderDistrictPills = () => (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
        {t.districtLabel}
      </label>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        {districtList.map((district) => {
          const isAll = district === 'All places';
          const isSelected = isAll
            ? !filters.district || filters.district === ''
            : filters.district === district;

          return (
            <button
              key={district}
              type="button"
              onClick={() => onFilterChange('district', isAll ? '' : district)}
              className={cn(
                'px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-2xs active:scale-95 min-h-[40px] flex items-center justify-center',
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 border border-blue-600'
                  : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {getDistrictLabel(district)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const filterFields = (
    <div className="space-y-4">
      {/* District Filter Pills */}
      {renderDistrictPills()}

      {/* Taluk / City Select */}
      {facets.taluks && facets.taluks.length > 0 && (
        <Select
          label={t.talukLabel}
          placeholder={language === 'kn' ? 'ಎಲ್ಲಾ ತಾಲೂಕುಗಳು' : 'All Taluks / Cities'}
          value={filters.taluk || ''}
          onChange={(e) => onFilterChange('taluk', e.target.value)}
          disabled={isLoadingFacets}
          options={facets.taluks.map((tVal) => ({ value: tVal, label: tVal }))}
        />
      )}

      {/* Assembly Constituency Select */}
      <Select
        label={t.acLabel}
        placeholder={language === 'kn' ? 'ಎಲ್ಲಾ ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರಗಳು' : 'All ACs'}
        value={filters.ac || ''}
        onChange={(e) => onFilterChange('ac', e.target.value)}
        disabled={isLoadingFacets}
        options={facets.acs.map((a) => ({ value: a, label: a }))}
      />

      {/* Part / Booth Number Select */}
      <Select
        label={t.partLabel}
        placeholder={language === 'kn' ? 'ಎಲ್ಲಾ ಮತಗಟ್ಟೆಗಳು' : 'All Booths'}
        value={filters.part || ''}
        onChange={(e) => onFilterChange('part', e.target.value)}
        disabled={isLoadingFacets}
        options={facets.parts.map((p) => ({
          value: p,
          label: language === 'kn' ? `ಭಾಗ ${p}` : `Part ${p}`,
        }))}
      />

      {/* Village / Ward Input */}
      <div className="space-y-1.5 w-full">
        <label
          htmlFor="filter-village"
          className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          {t.villageLabel}
        </label>
        <input
          id="filter-village"
          type="text"
          value={filters.village || ''}
          onChange={(e) => onFilterChange('village', e.target.value)}
          placeholder={language === 'kn' ? 'ಉದಾ: ಕ್ಯಾತಸಂದ್ರ' : 'e.g. Kyathsandra'}
          className="w-full min-h-[46px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[16px] sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition shadow-2xs"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-2">
      {/* Universal Collapsible Filter Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/70 transition-colors',
            isExpanded && 'border-b border-slate-100'
          )}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition"
          >
            <Filter className="w-4 h-4 text-blue-600" />
            <span>
              {language === 'kn'
                ? 'ಹೆಚ್ಚಿನ ಫಿಲ್ಟರ್‌ಗಳು (ಮತಗಟ್ಟೆ & ಕ್ಷೇತ್ರ)'
                : 'Advanced Constituency & Booth Filters'}
            </span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                {activeCount} {language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ' : 'Active'}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-rose-600 hover:text-rose-700 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Expanded Body: District Pills + Advanced Breakdown */}
        {isExpanded && (
          <div className="p-4 sm:p-5 space-y-5 animate-fadeIn">
            {/* District Pills Section */}
            {renderDistrictPills()}

            {/* Advanced Filters Breakdown (AC, Part, Village) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100">
              <Select
                label={t.acLabel}
                placeholder={language === 'kn' ? 'ಎಲ್ಲಾ ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರಗಳು' : 'All ACs'}
                value={filters.ac || ''}
                onChange={(e) => onFilterChange('ac', e.target.value)}
                disabled={isLoadingFacets}
                options={facets.acs.map((a) => ({ value: a, label: a }))}
              />

              <Select
                label={t.partLabel}
                placeholder={language === 'kn' ? 'ಎಲ್ಲಾ ಮತಗಟ್ಟೆಗಳು' : 'All Booths'}
                value={filters.part || ''}
                onChange={(e) => onFilterChange('part', e.target.value)}
                disabled={isLoadingFacets}
                options={facets.parts.map((p) => ({
                  value: p,
                  label: language === 'kn' ? `ಭಾಗ ${p}` : `Part ${p}`,
                }))}
              />

              <div className="space-y-1.5 w-full">
                <label
                  htmlFor="desktop-filter-village"
                  className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
                >
                  {t.villageLabel}
                </label>
                <input
                  id="desktop-filter-village"
                  type="text"
                  value={filters.village || ''}
                  onChange={(e) => onFilterChange('village', e.target.value)}
                  placeholder={language === 'kn' ? 'ಉದಾ: ಕ್ಯಾತಸಂದ್ರ' : 'e.g. Kyathsandra'}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition shadow-2xs min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filters.district && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span>{language === 'kn' ? 'ಜಿಲ್ಲೆ' : 'District'}: {getDistrictLabel(filters.district)}</span>
              <button
                type="button"
                onClick={() => onFilterChange('district', '')}
                className="p-0.5 rounded-full hover:bg-blue-200 transition"
                aria-label="Remove district filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.ac && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span>{language === 'kn' ? 'ಕ್ಷೇತ್ರ' : 'AC'}: {filters.ac}</span>
              <button
                type="button"
                onClick={() => onFilterChange('ac', '')}
                className="p-0.5 rounded-full hover:bg-blue-200 transition"
                aria-label="Remove AC filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.part && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span>{language === 'kn' ? 'ಭಾಗ' : 'Part'}: {filters.part}</span>
              <button
                type="button"
                onClick={() => onFilterChange('part', '')}
                className="p-0.5 rounded-full hover:bg-blue-200 transition"
                aria-label="Remove part filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.village && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span>{language === 'kn' ? 'ಪ್ರದೇಶ' : 'Area'}: {filters.village}</span>
              <button
                type="button"
                onClick={() => onFilterChange('village', '')}
                className="p-0.5 rounded-full hover:bg-blue-200 transition"
                aria-label="Remove village filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={language === 'kn' ? 'ಮತದಾರರ ಪಟ್ಟಿ ಫಿಲ್ಟರ್' : 'Filter Electoral Roll'}
        subtitle={
          language === 'kn'
            ? 'ಜಿಲ್ಲೆ, ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ, ಮತಗಟ್ಟೆ ಮತ್ತು ಪ್ರದೇಶದ ಪ್ರಕಾರ'
            : 'Narrow by District, AC, Booth Part, and Village'
        }
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
              {language === 'kn' ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset'}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsSheetOpen(false)}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {language === 'kn' ? `ಅನ್ವಯಿಸಿ (${activeCount})` : `Apply (${activeCount})`}
            </Button>
          </div>
        }
      >
        {filterFields}
      </BottomSheet>
    </div>
  );
}
