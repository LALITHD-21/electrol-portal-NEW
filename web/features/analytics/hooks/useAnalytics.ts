'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardStatsResponse } from '../types';
import { AnalyticsQueryParams } from '../schema';

export function useAnalytics() {
  const searchParams = useSearchParams();

  const initialDistrict = searchParams.get('district') || '';
  const initialAc = searchParams.get('ac') || '';
  const initialTaluk = searchParams.get('taluk') || '';
  const initialPart = searchParams.get('part') || '';

  const [filters, setFilters] = useState<AnalyticsQueryParams>({
    district: initialDistrict,
    ac: initialAc,
    taluk: initialTaluk,
    part: initialPart,
  });

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const fetchStats = useCallback(
    async (currentFilters: AnalyticsQueryParams, isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else if (!stats) setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (currentFilters.district) params.set('district', currentFilters.district);
        if (currentFilters.ac) params.set('ac', currentFilters.ac);
        if (currentFilters.taluk) params.set('taluk', currentFilters.taluk);
        if (currentFilters.part) params.set('part', currentFilters.part);

        const res = await fetch(`/api/analytics/stats?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || 'Failed to fetch analytics statistics');
        }

        const data: DashboardStatsResponse = await res.json();
        if (isMountedRef.current) {
          setStats(data);
          setError(null);
          setLastRefreshed(data.refreshed_at || new Date().toISOString());
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Analytics loading error';
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [stats]
  );

  // Sync filters to browser URL without reloading
  const updateUrl = useCallback((currentFilters: AnalyticsQueryParams) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (currentFilters.district) params.set('district', currentFilters.district);
    if (currentFilters.ac) params.set('ac', currentFilters.ac);
    if (currentFilters.taluk) params.set('taluk', currentFilters.taluk);
    if (currentFilters.part) params.set('part', currentFilters.part);

    const newUrl = params.toString() ? `/analytics?${params.toString()}` : '/analytics';
    window.history.replaceState({}, '', newUrl);
  }, []);

  const handleFilterChange = (key: keyof AnalyticsQueryParams, value: string) => {
    const updated = { ...filters, [key]: value };
    // Cascading reset: if district changes, reset AC, Taluk, Part
    if (key === 'district') {
      updated.ac = '';
      updated.taluk = '';
      updated.part = '';
    } else if (key === 'ac') {
      updated.part = '';
    }

    setFilters(updated);
    updateUrl(updated);
    fetchStats(updated, true);
  };

  const handleResetFilters = () => {
    const emptyFilters: AnalyticsQueryParams = {
      district: '',
      ac: '',
      taluk: '',
      part: '',
    };
    setFilters(emptyFilters);
    updateUrl(emptyFilters);
    fetchStats(emptyFilters, true);
  };

  // Cross-filtering action: click chart item to filter
  const handleCrossFilter = (key: keyof AnalyticsQueryParams, value: string) => {
    handleFilterChange(key, value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats(filters);

    // 60-second polling fallback
    const interval = setInterval(() => {
      fetchStats(filters, true);
    }, 60000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStats, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    stats,
    filters,
    isLoading,
    isRefreshing,
    error,
    lastRefreshed,
    activeFilterCount,
    handleFilterChange,
    handleResetFilters,
    handleCrossFilter,
    refresh: () => fetchStats(filters, true),
  };
}
