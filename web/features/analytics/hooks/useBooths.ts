'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BoothTableRow, BoothTableResponse } from '../types';

export function useBooths(districtFilter = '', acFilter = '') {
  const [booths, setBooths] = useState<BoothTableRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('part_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBooths = useCallback(
    async (
      currentPage: number,
      currentPageSize: number,
      currentSearch: string,
      currentSortBy: string,
      currentSortOrder: 'asc' | 'desc'
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (districtFilter) params.set('district', districtFilter);
        if (acFilter) params.set('ac', acFilter);
        if (currentSearch.trim()) params.set('search', currentSearch.trim());
        params.set('page', String(currentPage));
        params.set('pageSize', String(currentPageSize));
        params.set('sortBy', currentSortBy);
        params.set('sortOrder', currentSortOrder);

        const res = await fetch(`/api/analytics/booths?${params.toString()}`);
        if (res.ok) {
          const data: BoothTableResponse = await res.json();
          setBooths(data.booths);
          setTotal(data.total);
          setPage(data.page);
        }
      } catch (err) {
        console.error('Failed to load booths:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [districtFilter, acFilter]
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchBooths(1, pageSize, val, sortBy, sortOrder);
    }, 300);
  };

  const handleSortChange = (column: string) => {
    const nextOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(nextOrder);
    fetchBooths(page, pageSize, search, column, nextOrder);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBooths(newPage, pageSize, search, sortBy, sortOrder);
  };

  useEffect(() => {
    fetchBooths(1, pageSize, search, sortBy, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtFilter, acFilter, pageSize]);

  return {
    booths,
    total,
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    isLoading,
    totalPages: Math.ceil(total / pageSize),
    handleSearchChange,
    handleSortChange,
    handlePageChange,
    setPageSize,
  };
}
