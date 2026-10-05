import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { analyticsQuerySchema } from '@/features/analytics/schema';
import { DashboardStatsResponse } from '@/features/analytics/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  // 1. Role-based security boundary (Admin and Operator only)
  const auth = requireRole(request, 'admin', 'operator');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 2. Validate optional query filters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = analyticsQuerySchema.safeParse(searchParams);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid filter parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { district, ac, taluk, part } = parseResult.data;
  const isFiltered = Boolean(district || ac || taluk || part);

  try {
    const supabase = createAdminClient();
    let stats: DashboardStatsResponse;
    let refreshedAt: string | undefined;

    // Fast Path (Unfiltered): Serve pre-computed snapshot (< 10 ms)
    if (!isFiltered) {
      const { data: snapshotData, error: snapshotErr } = await supabase
        .from('dashboard_snapshot')
        .select('refreshed_at, payload')
        .eq('id', 1)
        .maybeSingle();

      if (snapshotData && snapshotData.payload) {
        stats = snapshotData.payload as DashboardStatsResponse;
        refreshedAt = snapshotData.refreshed_at;
      } else {
        // Fallback: Compute live and update snapshot
        const { data: liveData, error: liveErr } = await supabase.rpc('refresh_dashboard_snapshot');
        if (liveErr) throw new Error(liveErr.message);
        stats = liveData as DashboardStatsResponse;
        refreshedAt = new Date().toISOString();
      }
    } else {
      // Filtered Path: Run live SQL function with parameters
      const { data: liveData, error: liveErr } = await supabase.rpc('get_dashboard_stats', {
        p_district: district || null,
        p_ac: ac || null,
        p_taluk: taluk || null,
        p_part: part || null,
      });

      if (liveErr) throw new Error(liveErr.message);
      stats = liveData as DashboardStatsResponse;
    }

    // 3. Security Boundary: Strip sensitive caste data for non-admin roles
    if (auth.session.role !== 'admin') {
      delete stats.caste_majority;
    }

    const durationMs = Math.round(performance.now() - startTime);
    stats.refreshed_at = refreshedAt;
    stats.isFiltered = isFiltered;
    stats.durationMs = durationMs;

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': isFiltered
          ? 'no-store, no-cache, must-revalidate'
          : 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analytics stats';
    console.error('Analytics stats exception:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
