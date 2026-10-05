import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'operator', 'field_agent');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = createAdminClient();
    
    // Query exact row count using Supabase exact count option
    const { count, error } = await supabase
      .from('electors')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Stats query error:', error);
      // Fallback query without head flag if needed
      const { count: fallbackCount } = await supabase
        .from('electors')
        .select('id', { count: 'exact' })
        .limit(1);
      return NextResponse.json({ count: fallbackCount ?? 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err: unknown) {
    console.error('Stats endpoint error:', err);
    return NextResponse.json({ count: 0 });
  }
}
