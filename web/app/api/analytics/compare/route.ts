import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'operator', 'field_agent');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') === 'ac' ? 'ac' : 'district';
    const itemA = searchParams.get('itemA') || '';
    const itemB = searchParams.get('itemB') || '';

    if (!itemA || !itemB) {
      return NextResponse.json(
        { error: 'Both itemA and itemB parameters are required for comparison' },
        { status: 400 }
      );
    }

    const rpcParamsA = type === 'ac' ? { p_ac: itemA } : { p_district: itemA };
    const rpcParamsB = type === 'ac' ? { p_ac: itemB } : { p_district: itemB };

    const [resA, resB] = await Promise.all([
      supabase.rpc('get_dashboard_stats', rpcParamsA),
      supabase.rpc('get_dashboard_stats', rpcParamsB),
    ]);

    if (resA.error) throw resA.error;
    if (resB.error) throw resB.error;

    // Filter caste for non-admin
    const statsA = resA.data;
    const statsB = resB.data;
    if (auth.session.role !== 'admin') {
      delete statsA?.caste_majority;
      delete statsB?.caste_majority;
    }

    return NextResponse.json({
      type,
      itemA: {
        name: itemA,
        stats: statsA,
      },
      itemB: {
        name: itemB,
        stats: statsB,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Comparison query failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
