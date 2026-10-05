import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { SearchFacets } from '@/features/search/types';

export const dynamic = 'force-dynamic';

// In-memory cache for facet options (5-minute TTL)
let cachedFacets: SearchFacets | null = null;
let cacheExpiresAt = 0;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'operator', 'field_agent');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const now = Date.now();
  if (cachedFacets && now < cacheExpiresAt) {
    return NextResponse.json(cachedFacets);
  }

  try {
    const supabase = createAdminClient();

    // Query booth_master for full administrative mapping
    const { data: boothData, error: boothError } = await supabase
      .from('booth_master')
      .select('part_number, district, ac_name');

    if (boothError || !boothData || boothData.length === 0) {
      // Fallback to electors if booth_master is unavailable
      const { data: electorsData } = await supabase
        .from('electors')
        .select('district, ac_name, part_number')
        .limit(1000);

      const districts = Array.from(
        new Set<string>((electorsData || []).map((r) => r.district?.trim()).filter((d): d is string => Boolean(d)))
      ).sort((a, b) => a.localeCompare(b));

      const acs = Array.from(
        new Set<string>((electorsData || []).map((r) => r.ac_name?.trim()).filter((a): a is string => Boolean(a)))
      ).sort((a, b) => a.localeCompare(b));

      const parts = Array.from(
        new Set<string>((electorsData || []).map((r) => r.part_number?.trim()).filter((p): p is string => Boolean(p)))
      ).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      return NextResponse.json({ districts, acs, parts });
    }

    const districtsSet = new Set<string>();
    const acsSet = new Set<string>();
    const partsSet = new Set<string>();
    const districtAcsMap: Record<string, Set<string>> = {};

    for (const row of boothData) {
      const d = row.district?.trim();
      const a = row.ac_name?.trim();
      const p = row.part_number?.trim();

      if (d) {
        districtsSet.add(d);
        if (!districtAcsMap[d]) {
          districtAcsMap[d] = new Set<string>();
        }
        if (a) {
          districtAcsMap[d].add(a);
        }
      }
      if (a) acsSet.add(a);
      if (p) partsSet.add(p);
    }

    const districts = Array.from(districtsSet).sort((a, b) => a.localeCompare(b));
    const acs = Array.from(acsSet).sort((a, b) => a.localeCompare(b));
    const parts = Array.from(partsSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const districtAcs: Record<string, string[]> = {};
    for (const [dist, acSet] of Object.entries(districtAcsMap)) {
      districtAcs[dist] = Array.from(acSet).sort((a, b) => a.localeCompare(b));
    }

    const facets: SearchFacets = {
      districts,
      acs,
      parts,
      districtAcs,
    };

    cachedFacets = facets;
    cacheExpiresAt = now + 5 * 60 * 1000; // 5 min TTL

    return NextResponse.json(facets, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err: unknown) {
    console.error('Error loading search facets:', err);
    return NextResponse.json(
      { districts: [], acs: [], parts: [] },
      { status: 500 }
    );
  }
}
