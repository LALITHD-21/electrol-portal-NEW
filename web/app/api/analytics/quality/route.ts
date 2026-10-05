import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Role verification: admin or operator only
  const auth = requireRole(request, 'admin', 'operator');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      const { data, error } = await supabase.rpc('refresh_data_quality_snapshot');
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Try reading cached snapshot first
    const { data: snapshot, error: snapshotErr } = await supabase
      .from('data_quality_snapshot')
      .select('payload, refreshed_at')
      .eq('id', 1)
      .maybeSingle();

    if (!snapshotErr && snapshot?.payload) {
      return NextResponse.json(snapshot.payload, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Fallback: trigger fresh compute
    const { data: freshData, error: rpcErr } = await supabase.rpc('refresh_data_quality_snapshot');
    if (rpcErr) throw rpcErr;

    return NextResponse.json(freshData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve data quality report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
