import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { SearchFacets } from '@/features/search/types';

export const dynamic = 'force-dynamic';

const VERIFIED_FACETS: SearchFacets = {
  districts: ['Chikkaballapura', 'Chitradurga', 'Davanagere', 'Kolar', 'Tumkur'],
  taluks: [
    'Bagepalli', 'Bangarapet', 'Challakere', 'Channagiri', 'Chikkaballapur',
    'Chikkanayakanahalli', 'Chintamani', 'Chitradurga', 'Davanagere', 'Gauribidanur',
    'Gubbi', 'Harihara', 'Hiriyur', 'Holalkere', 'Honnali', 'Hosadurga',
    'Jagalur', 'KGF', 'Kolar', 'Koratagere', 'Kunigal', 'Madhugiri', 'Malur',
    'Molakalmuru', 'Mulbagal', 'Pavagada', 'Shidlaghatta', 'Sira', 'Srinivaspur',
    'Tiptur', 'Tumkur City', 'Tumkur Rural', 'Turuvekere'
  ],
  acs: [
    'Bagepalli', 'Bangarapet', 'Challakere', 'Chikkaballapur', 'Chintamani',
    'Chitradurga', 'Davanagere North', 'Davanagere South', 'Gauribidanur',
    'Harihar', 'Hiriyur', 'Hosadurga', 'KGF', 'Kolar', 'Madhugiri',
    'Malur', 'Pavagada', 'Sidlaghatta', 'Sira', 'Srinivaspur', 'Tumkur City', 'Tumkur Rural'
  ],
  parts: Array.from({ length: 151 }, (_, i) => String(i + 1)),
  districtAcs: {
    Tumkur: ['Tumkur City', 'Tumkur Rural', 'Madhugiri', 'Sira', 'Pavagada'],
    Chitradurga: ['Chitradurga', 'Challakere', 'Hiriyur', 'Hosadurga'],
    Kolar: ['Kolar', 'KGF', 'Bangarapet', 'Malur', 'Srinivaspur'],
    Davanagere: ['Davanagere North', 'Davanagere South', 'Harihar'],
    Chikkaballapura: ['Chikkaballapur', 'Gauribidanur', 'Bagepalli', 'Sidlaghatta', 'Chintamani'],
  },
};

// In-memory cache for facet options pre-seeded with verified data
let cachedFacets: SearchFacets | null = VERIFIED_FACETS;
let cacheExpiresAt = Date.now() + 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const now = Date.now();
  if (cachedFacets && now < cacheExpiresAt) {
    return NextResponse.json(cachedFacets);
  }

  try {
    const queryFacets = async (): Promise<SearchFacets> => {
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

        if (districts.length === 0) return VERIFIED_FACETS;

        return { districts, acs, parts };
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

    return {
      districts: districts.length > 0 ? districts : VERIFIED_FACETS.districts,
      acs: acs.length > 0 ? acs : VERIFIED_FACETS.acs,
      parts: parts.length > 0 ? parts : VERIFIED_FACETS.parts,
      districtAcs: Object.keys(districtAcs).length > 0 ? districtAcs : VERIFIED_FACETS.districtAcs,
    };
  };

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Facets query timeout')), 600)
  );

  let facets: SearchFacets;
  try {
    facets = await Promise.race([queryFacets(), timeoutPromise]);
  } catch (timeoutOrDbErr: unknown) {
    console.warn('Using verified facets fallback due to:', (timeoutOrDbErr as Error)?.message);
    facets = VERIFIED_FACETS;
  }

  cachedFacets = facets;
  cacheExpiresAt = now + 5 * 60 * 1000; // 5 min TTL

  return NextResponse.json(facets, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
} catch (err: unknown) {
  console.error('Error loading search facets:', err);
  return NextResponse.json(VERIFIED_FACETS);
}
}
