import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedCount: number = 223789;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60-second cache

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'operator', 'field_agent');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const now = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const isManual = searchParams.get('manual') === '1';

  // Return cached count immediately if fresh (or if not manual refresh)
  if (!isManual && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(
      { count: cachedCount },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  }

  try {
    const fetchCount = async () => {
      const supabase = createAdminClient();
      const { count, error } = await supabase
        .from('electors')
        .select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? 223789;
    };

    // Fast 600ms timeout: never hang the Node server thread
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stats count timeout')), 600)
    );

    let count = cachedCount;
    try {
      count = await Promise.race([fetchCount(), timeoutPromise]);
      cachedCount = count;
    } catch {
      // Remote timeout: keep cached count
    }
    lastFetchTime = Date.now();

    return NextResponse.json(
      { count: cachedCount },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (err: unknown) {
    lastFetchTime = Date.now();
    return NextResponse.json({ count: cachedCount });
  }
}
