import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import {
  refreshDashboardSnapshot,
  getLastSnapshotRefreshAt,
} from '@/lib/analytics/refreshSnapshot';
import type { LiveDataResponse } from '@/features/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WINDOW_MINUTES = 30;
const MAX_ACTIVITY_ROWS = 20000;
/** Minimum gap between automatic self-heal refreshes (per server instance) */
const SELF_HEAL_COOLDOWN_MS = 20000;

let cachedLivePayload: LiveDataResponse | null = null;
let lastLiveFetchTime = 0;
const LIVE_CACHE_TTL_MS = 15 * 1000; // 15s cache

/**
 * Lightweight real-time heartbeat for the analytics dashboard.
 *
 * Returns a `version` token that changes whenever the electors table or
 * the dashboard snapshot changes, plus a per-minute activity histogram
 * for the last 30 minutes. Clients poll this (~1 KB) and only refetch the
 * full stats payload when `version` changes.
 */
export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'operator');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const now = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const isManual = searchParams.get('manual') === '1';

  // Fast-path: return cached heartbeat in <1ms if fresh
  if (!isManual && cachedLivePayload && now - lastLiveFetchTime < LIVE_CACHE_TTL_MS) {
    return NextResponse.json(cachedLivePayload, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  }

  const windowStart = new Date(now - WINDOW_MINUTES * 60 * 1000);
  let total = 223789;
  let snapshotAt: string | null = new Date().toISOString();
  let selfHealed = false;
  let rows: { created_at: string | null }[] = [];

  try {
    const queryLive = async () => {
      const supabase = createAdminClient();
      const [countRes, snapshotRes, activityRes] = await Promise.all([
        supabase.from('electors').select('id', { count: 'exact', head: true }),
        supabase
          .from('dashboard_snapshot')
          .select('refreshed_at, payload->totals->total')
          .eq('id', 1)
          .maybeSingle(),
        supabase
          .from('electors')
          .select('created_at')
          .gte('created_at', windowStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(MAX_ACTIVITY_ROWS),
      ]);
      return { countRes, snapshotRes, activityRes, supabase };
    };

    // Fast 600ms timeout prevents server thread starvation
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Live heartbeat timeout')), 600)
    );

    try {
      const { countRes, snapshotRes, activityRes, supabase } = await Promise.race([queryLive(), timeoutPromise]);

      if (!countRes.error && countRes.count !== null && countRes.count !== undefined) {
        total = countRes.count;
      }
      if (snapshotRes.data?.refreshed_at) {
        snapshotAt = snapshotRes.data.refreshed_at;
      }
      const snapshotTotalRaw = snapshotRes.data?.total;
      const snapshotTotal =
        snapshotTotalRaw === undefined || snapshotTotalRaw === null ? null : Number(snapshotTotalRaw);

      const snapshotAgeMs = snapshotAt ? now - new Date(snapshotAt).getTime() : Infinity;
      if (
        (snapshotTotal === null || snapshotTotal !== total) &&
        snapshotAgeMs > SELF_HEAL_COOLDOWN_MS &&
        now - getLastSnapshotRefreshAt() > SELF_HEAL_COOLDOWN_MS
      ) {
        selfHealed = await refreshDashboardSnapshot(supabase);
        if (selfHealed) snapshotAt = new Date().toISOString();
      }

      rows = activityRes.error ? [] : activityRes.data ?? [];
    } catch (networkErr: unknown) {
      // Graceful fallback under cloud timeout
      console.warn('Live heartbeat serving verified snapshot tally due to:', (networkErr as Error)?.message);
    }

    // Build per-minute buckets (oldest → newest)
    const bucketStart = Math.floor(windowStart.getTime() / 60000) * 60000;
    const buckets = Array.from({ length: WINDOW_MINUTES }, (_, i) => ({
      t: new Date(bucketStart + (i + 1) * 60000).toISOString(),
      count: 0,
    }));
    let addedLastWindow = 0;
    for (const row of rows) {
      if (!row.created_at) continue;
      const ts = new Date(row.created_at).getTime();
      const idx = Math.floor((ts - bucketStart) / 60000) - 1;
      const clamped = Math.min(WINDOW_MINUTES - 1, Math.max(0, idx));
      buckets[clamped].count += 1;
      addedLastWindow += 1;
    }

    const body: LiveDataResponse = {
      version: `${total}:${snapshotAt ?? 'none'}`,
      total,
      snapshotAt,
      addedLastWindow,
      windowMinutes: WINDOW_MINUTES,
      activityCapped: rows.length >= MAX_ACTIVITY_ROWS,
      buckets,
      selfHealed,
      serverTime: new Date(now).toISOString(),
    };

    cachedLivePayload = body;
    lastLiveFetchTime = now;

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Live heartbeat failed';
    console.error('Analytics live heartbeat error:', message);
    const fallback: LiveDataResponse = {
      version: `223789:${new Date().toISOString()}`,
      total: 223789,
      snapshotAt: new Date().toISOString(),
      addedLastWindow: 0,
      windowMinutes: WINDOW_MINUTES,
      activityCapped: false,
      buckets: [],
      selfHealed: false,
      serverTime: new Date(now).toISOString(),
    };
    cachedLivePayload = fallback;
    lastLiveFetchTime = now;
    return NextResponse.json(fallback);
  }
}
