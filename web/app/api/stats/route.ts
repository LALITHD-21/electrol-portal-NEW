import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isLocalAnalyticsReady, getLocalVersion } from '@/lib/analytics/localAnalytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedCount: number = 183818;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 1000; // 10-second fast cache

export async function GET(request: NextRequest) {
  const now = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const isManual = searchParams.get('manual') === '1';

  // Primary: Real-time local SQLite count (instant <1ms, always synchronized with electors.db)
  if (isLocalAnalyticsReady()) {
    try {
      const v = getLocalVersion(isManual);
      if (v) {
        cachedCount = v.total;
        lastFetchTime = now;
        return NextResponse.json(
          { count: v.total, source: 'sqlite-local', timestamp: now },
          { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15' } }
        );
      }
    } catch (localErr) {
      console.warn('Local stats query failed, falling back to remote snapshot:', localErr);
    }
  }

  // Return cached count immediately if fresh (or if not manual refresh)
  if (!isManual && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(
      { count: cachedCount, source: 'cache', timestamp: lastFetchTime },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } }
    );
  }

  try {
    const fetchCount = async () => {
      const supabase = createAdminClient();
      // Fast path: query dashboard_snapshot in <5ms without triggering heavy seq-scans
      const { data: snap } = await supabase
        .from('dashboard_snapshot')
        .select('payload->totals->total')
        .eq('id', 1)
        .maybeSingle();

      if (snap && snap.total) {
        return Number(snap.total);
      }

      // Secondary fallback
      const { count } = await supabase
        .from('electors')
        .select('id', { count: 'exact', head: true });
      return count ?? 183818;
    };

    // Fast 1500ms timeout prevents server lag under cloud latency
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stats count timeout')), 1500)
    );

    let count = cachedCount;
    try {
      count = await Promise.race([fetchCount(), timeoutPromise]);
      cachedCount = count;
    } catch {
      // Cloud timeout: keep current verified count
    }
    lastFetchTime = Date.now();

    return NextResponse.json(
      { count: cachedCount, source: 'remote-snapshot', timestamp: lastFetchTime },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } }
    );
  } catch (err: unknown) {
    lastFetchTime = Date.now();
    return NextResponse.json({ count: cachedCount, source: 'fallback', timestamp: lastFetchTime });
  }
}
