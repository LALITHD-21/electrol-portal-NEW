'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SearchApiResponse,
  SearchResultRow,
  SearchFiltersState,
  SearchQueryType,
  BoothHeaderInfo,
} from '../types';
import { isEpicCached, getElectorByEpic } from '@/lib/electorService';
import { normalizeEpic, isValidEpic } from '@/lib/utils';
import { saveSearchHistoryItem, SearchHistoryItem } from '@/lib/searchHistory';

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial values from URL search params
  const initialQ = searchParams.get('q') || '';
  const initialPart = searchParams.get('part') || '';
  const initialAc = searchParams.get('ac') || '';
  const initialDistrict = searchParams.get('district') || '';
  const initialTaluk = searchParams.get('taluk') || '';
  const initialVillage = searchParams.get('village') || '';
  const initialFuzzy = searchParams.get('fuzzy') === 'true';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [query, setQuery] = useState(initialQ);
  const [filters, setFilters] = useState<SearchFiltersState>({
    part: initialPart,
    ac: initialAc,
    district: initialDistrict,
    taluk: initialTaluk,
    village: initialVillage,
    fuzzy: initialFuzzy,
  });
  const [page, setPage] = useState(initialPage);

  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [queryType, setQueryType] = useState<SearchQueryType>('name');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [boothInfo, setBoothInfo] = useState<BoothHeaderInfo | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to URL without reloading
  const updateUrl = useCallback(
    (q: string, currentFilters: SearchFiltersState, currentPage: number) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (currentFilters.part) params.set('part', currentFilters.part);
      if (currentFilters.ac) params.set('ac', currentFilters.ac);
      if (currentFilters.district) params.set('district', currentFilters.district);
      if (currentFilters.taluk) params.set('taluk', currentFilters.taluk);
      if (currentFilters.village) params.set('village', currentFilters.village);
      if (currentFilters.fuzzy) params.set('fuzzy', 'true');
      if (currentPage > 1) params.set('page', String(currentPage));

      const isAnalytics = typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics');
      if (isAnalytics) {
        params.set('tab', 'search');
        const newUrl = `/analytics?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      } else {
        const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        window.history.replaceState({}, '', newUrl);
      }
    },
    []
  );

  const executeSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: SearchFiltersState,
      targetPage: number
    ) => {
      // Abort any pending in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmed = searchQuery.trim();
      const hasFilter = Boolean(
        searchFilters.part ||
          searchFilters.ac ||
          searchFilters.district ||
          searchFilters.taluk ||
          searchFilters.village
      );

      // If empty query and no filter, clear results
      if (!trimmed && !hasFilter) {
        setResults([]);
        setTotal(0);
        setIsLoading(false);
        setError(null);
        setDurationMs(null);
        setBoothInfo(null);
        return;
      }

      // Check client-side 0ms cache for exact EPIC
      const normalizedEpic = normalizeEpic(trimmed);
      if (isValidEpic(normalizedEpic) && !hasFilter && targetPage === 1) {
        if (isEpicCached(normalizedEpic)) {
          const cachedResult = await getElectorByEpic(normalizedEpic);
          if (cachedResult.elector) {
            setResults([cachedResult.elector as unknown as SearchResultRow]);
            setTotal(1);
            setQueryType('epic');
            setDurationMs(cachedResult.durationMs);
            setIsLoading(false);
            setError(null);
            setBoothInfo(null);
            saveSearchHistoryItem(normalizedEpic, 'epic', { label: cachedResult.elector.name });
            return;
          }
        }
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (searchFilters.part) params.set('part', searchFilters.part);
        if (searchFilters.ac) params.set('ac', searchFilters.ac);
        if (searchFilters.district) params.set('district', searchFilters.district);
        if (searchFilters.taluk) params.set('taluk', searchFilters.taluk);
        if (searchFilters.village) params.set('village', searchFilters.village);
        if (searchFilters.fuzzy) params.set('fuzzy', 'true');
        params.set('page', String(targetPage));
        params.set('pageSize', String(pageSize));

        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || 'Failed to search voters');
        }

        const data: SearchApiResponse = await res.json();
        setResults(data.rows);
        setTotal(data.total);
        setQueryType(data.queryType);
        setDurationMs(data.durationMs);
        setPage(data.page);
        setBoothInfo(data.boothInfo || null);
        setIsLoading(false);

        // Save to recent search history
        if (trimmed) {
          if (isValidEpic(normalizedEpic)) {
            saveSearchHistoryItem(normalizedEpic, 'epic', { label: data.rows[0]?.name });
          } else if (/^\d{10}$/.test(trimmed)) {
            saveSearchHistoryItem(trimmed, 'mobile');
          } else {
            saveSearchHistoryItem(trimmed, 'name');
          }
        } else if (searchFilters.part) {
          saveSearchHistoryItem(`Part ${searchFilters.part}`, 'booth', { part: searchFilters.part });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        const message = err instanceof Error ? err.message : 'Search error occurred';
        setError(message);
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // Trigger search with 200 ms debounce when query or filters change
  const triggerDebouncedSearch = useCallback(
    (newQ: string, newFilters: SearchFiltersState, newPage: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateUrl(newQ, newFilters, newPage);
        executeSearch(newQ, newFilters, newPage);
      }, 200);
    },
    [executeSearch, updateUrl]
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1);
    const normalized = normalizeEpic(val.trim());
    if (isValidEpic(normalized)) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      updateUrl(val, filters, 1);
      executeSearch(val, filters, 1);
      return;
    }
    triggerDebouncedSearch(val, filters, 1);
  };

  const handleFilterChange = (key: keyof SearchFiltersState, value: string | boolean) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    setPage(1);
    triggerDebouncedSearch(query, updated, 1);
  };

  const handleToggleFuzzy = () => {
    const nextFuzzy = !filters.fuzzy;
    handleFilterChange('fuzzy', nextFuzzy);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFiltersState = {
      part: '',
      ac: '',
      district: '',
      village: '',
      fuzzy: false,
    };
    setFilters(emptyFilters);
    setPage(1);
    triggerDebouncedSearch(query, emptyFilters, 1);
  };

  const handleClearAll = () => {
    setQuery('');
    handleClearFilters();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(query, filters, newPage);
    executeSearch(query, filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecentSelect = (item: SearchHistoryItem) => {
    if (item.type === 'booth' && item.part) {
      setQuery('');
      const updatedFilters: SearchFiltersState = { ...filters, part: item.part };
      setFilters(updatedFilters);
      setPage(1);
      updateUrl('', updatedFilters, 1);
      executeSearch('', updatedFilters, 1);
    } else {
      setQuery(item.query);
      setPage(1);
      updateUrl(item.query, filters, 1);
      executeSearch(item.query, filters, 1);
    }
  };

  // CSV Page Export
  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (filters.part) params.set('part', filters.part);
      if (filters.ac) params.set('ac', filters.ac);
      if (filters.district) params.set('district', filters.district);
      if (filters.taluk) params.set('taluk', filters.taluk);
      if (filters.village) params.set('village', filters.village);
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/search/export?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to export CSV');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const partSuffix = filters.part ? `part_${filters.part}_` : '';
      a.download = `voters_list_${partSuffix}${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed';
      alert(`Export Error: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Initial search if query or filters were present in URL on first mount
  useEffect(() => {
    if (
      initialQ ||
      initialPart ||
      initialAc ||
      initialDistrict ||
      initialTaluk ||
      initialVillage ||
      initialFuzzy
    ) {
      executeSearch(
        initialQ,
        {
          part: initialPart,
          ac: initialAc,
          district: initialDistrict,
          taluk: initialTaluk,
          village: initialVillage,
          fuzzy: initialFuzzy,
        },
        initialPage
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    query,
    filters,
    page,
    pageSize,
    results,
    total,
    queryType,
    durationMs,
    boothInfo,
    isLoading,
    isExporting,
    error,
    totalPages: Math.ceil(total / pageSize),
    handleQueryChange,
    handleFilterChange,
    handleToggleFuzzy,
    handleClearFilters,
    handleClearAll,
    handlePageChange,
    handleRecentSelect,
    exportToCsv,
  };
}
