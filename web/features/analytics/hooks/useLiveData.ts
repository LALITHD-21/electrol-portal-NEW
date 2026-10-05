'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveDataResponse } from '../types';
import type { LiveStatus } from '@/components/ui/LiveIndicator';

interface UseLiveDataOptions {
  /** Polling interval in ms when page is visible and active (default: 20000) */
  pollInterval?: number;
  /** Callback fired whenever the server version changes (data update detected) */
  onVersionChange?: (newVersion: string, previousVersion: string | null) => void;
  /** Whether polling is enabled */
  enabled?: boolean;
}

export function useLiveData({
  pollInterval = 20000,
  onVersionChange,
  enabled = true,
}: UseLiveDataOptions = {}) {
  const [liveData, setLiveData] = useState<LiveDataResponse | null>(null);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevVersionRef = useRef<string | null>(null);
  const onVersionChangeRef = useRef(onVersionChange);
  onVersionChangeRef.current = onVersionChange;

  const isVisibleRef = useRef<boolean>(true);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const fetchLiveHeartbeat = useCallback(async (isManual = false) => {
    if (!enabled) return;

    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortCtrlRef.current = abortCtrl;

    if (isManual) setStatus('syncing');

    try {
      const url = isManual ? `/api/analytics/live?manual=1&t=${Date.now()}` : '/api/analytics/live';
      const res = await fetch(url, {
        signal: abortCtrl.signal,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setStatus('offline');
          return;
        }
        throw new Error(`Heartbeat HTTP ${res.status}`);
      }

      const data: LiveDataResponse = await res.json();
      setLiveData(data);
      const now = Date.now();
      setLastSyncAt(now);
      setStatus('live');
      setError(null);

      // Version diff detection
      if (prevVersionRef.current !== null && prevVersionRef.current !== data.version) {
        onVersionChangeRef.current?.(data.version, prevVersionRef.current);
      }
      prevVersionRef.current = data.version;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      console.warn('Live heartbeat poll failed:', err);
      setStatus('offline');
      setError(err instanceof Error ? err.message : 'Live heartbeat failed');
    }
  }, [enabled]);

  // Tab visibility handling: pause polling when user is not viewing tab
  useEffect(() => {
    const handleVisibility = () => {
      const visible = typeof document !== 'undefined' ? !document.hidden : true;
      isVisibleRef.current = visible;
      if (visible) {
        setStatus('syncing');
        fetchLiveHeartbeat();
      } else {
        setStatus('paused');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [fetchLiveHeartbeat]);

  // Main polling interval loop
  useEffect(() => {
    if (!enabled) return;

    fetchLiveHeartbeat();

    const intervalId = setInterval(() => {
      if (isVisibleRef.current) {
        fetchLiveHeartbeat();
      }
    }, pollInterval);

    return () => {
      clearInterval(intervalId);
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, [enabled, pollInterval, fetchLiveHeartbeat]);

  return {
    liveData,
    status,
    lastSyncAt,
    error,
    refreshLive: () => fetchLiveHeartbeat(true),
  };
}
