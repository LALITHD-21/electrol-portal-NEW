import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError, maskMobile } from '@/lib/auth/roles';
import { searchQuerySchema } from '@/features/search/schema';
import { SearchApiResponse, SearchResultRow, SearchQueryType } from '@/features/search/types';
import { normalizeEpic, isValidEpic } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber, BOOTH_MASTER_MAP } from '@/lib/boothMaster';

export const dynamic = 'force-dynamic';

// In-memory sliding window rate limiter per user/IP
// Allows up to 60 requests per minute per user session
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

function checkRateLimit(key: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  // 1. Check user authentication (Public citizens can search; staff have authenticated roles)
  const auth = requireRole(request, 'admin', 'supervisor', 'operator', 'field_agent');
  const isPublic = isAuthError(auth);

  // 2. Rate limiting check per user / public IP
  const rateLimitKey = isPublic
    ? (request.headers.get('x-forwarded-for') || 'public_anon')
    : (auth.session.userId || auth.session.username || 'staff_search');

  if (!checkRateLimit(rateLimitKey, 60, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a few seconds before searching again.' },
      { status: 429 }
    );
  }

  // 3. Parse & validate input query params with Zod
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = searchQuerySchema.safeParse(searchParams);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid search parameters',
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { q, mobile, part, ac, district, taluk, village, fuzzy, page, pageSize } = parseResult.data;

  try {
    const supabase = createAdminClient();

    // 4. Smart Query Router:
    // Determine query strategy: EPIC -> Mobile -> Name -> Booth -> Filter-only
    let queryType: SearchQueryType = 'filter';
    const trimmedQ = q.trim();
    const normalizedQEpic = normalizeEpic(trimmedQ);

    // Columns to retrieve for Search Result Row (Caste is omitted - aggregate only)
    const selectColumns = `
      id,
      serial_number,
      epic_number,
      name,
      relative_name,
      age,
      sex,
      whatsapp_mob,
      district,
      ac_name,
      taluk,
      village,
      part_number,
      polling_station_name,
      address,
      polling_address,
      qualification,
      occupation
    `;

    const isEpicQuery = isValidEpic(normalizedQEpic);
    let query = isEpicQuery
      ? supabase.from('electors').select(selectColumns)
      : supabase.from('electors').select(selectColumns, { count: 'exact' });

    // Mode A: Exact EPIC card number format (indexed 15ms lookup)
    if (isEpicQuery) {
      queryType = 'epic';
      query = query.eq('epic_number', normalizedQEpic).limit(1);
    }
    // Mode B: 10-digit Mobile number
    else if (
      /^\d{10}$/.test(trimmedQ) ||
      (mobile && /^\d{10}$/.test(mobile.replace(/\D/g, '')))
    ) {
      queryType = 'mobile';
      const phoneDigits = /^\d{10}$/.test(trimmedQ)
        ? trimmedQ
        : mobile.replace(/\D/g, '');
      // Match on sanitized whatsapp_mob
      query = query.ilike('whatsapp_mob', `%${phoneDigits}%`);
    }
    // Mode C: Name or Location text search (with optional fuzzy transliteration expansion)
    else if (trimmedQ.length > 0) {
      // Guard against slow 1-character full-table scans across 192k records unless filtered
      const hasAnyFilter = Boolean(part || ac || district || taluk || village);
      if (trimmedQ.length < 2 && !hasAnyFilter) {
        return NextResponse.json({
          rows: [],
          total: 0,
          page,
          pageSize,
          queryType: 'name',
          durationMs: Math.round(performance.now() - startTime),
          boothInfo: null,
        });
      }

      queryType = fuzzy ? 'fuzzy' : 'name';

      // Check transliteration variants table
      let canonicalTerm = '';
      if (fuzzy) {
        try {
          const { data: translitData } = await supabase
            .from('name_transliterations')
            .select('canonical')
            .eq('variant', trimmedQ.toLowerCase())
            .maybeSingle();
          if (translitData?.canonical) {
            canonicalTerm = translitData.canonical;
          }
        } catch {
          // Non-blocking fallback
        }
      }

      // Check if user entered a known location name (AC, Taluk, Booth area, e.g. "KGF", "Robertsonpet")
      const cleanQ = trimmedQ.replace(/[\.\s_-]/g, '').toLowerCase();
      const matchedLocationParts = Object.entries(BOOTH_MASTER_MAP)
        .filter(([_, info]) => {
          const infoAc = info.ac_name.replace(/[\.\s_-]/g, '').toLowerCase();
          const infoTaluk = info.taluk.replace(/[\.\s_-]/g, '').toLowerCase();
          const infoDist = info.district.replace(/[\.\s_-]/g, '').toLowerCase();
          return (
            infoAc === cleanQ ||
            infoTaluk === cleanQ ||
            infoDist === cleanQ ||
            info.ac_name.toLowerCase().includes(trimmedQ.toLowerCase()) ||
            info.taluk.toLowerCase().includes(trimmedQ.toLowerCase())
          );
        })
        .map(([p]) => p);

      if (matchedLocationParts.length > 0 && trimmedQ.length <= 20) {
        // Broaden search to include electors in this location or with this name
        query = query.or(
          `part_number.in.(${matchedLocationParts.join(',')}),name.ilike.%${trimmedQ}%,relative_name.ilike.%${trimmedQ}%,polling_station_name.ilike.%${trimmedQ}%,polling_address.ilike.%${trimmedQ}%,address.ilike.%${trimmedQ}%`
        );
      } else if (canonicalTerm && canonicalTerm.toLowerCase() !== trimmedQ.toLowerCase()) {
        query = query.or(
          `name.ilike.%${trimmedQ}%,name.ilike.%${canonicalTerm}%,relative_name.ilike.%${trimmedQ}%,relative_name.ilike.%${canonicalTerm}%`
        );
      } else {
        query = query.or(`name.ilike.%${trimmedQ}%,relative_name.ilike.%${trimmedQ}%`);
      }
    }
    // Mode D: Pure Booth Browse mode
    else if (part) {
      queryType = 'booth';
    }

    // Apply Filter dropdowns (District, Taluk, AC, Part, Village)
    if (district) {
      // Find all part numbers for this district from BOOTH_MASTER_MAP
      const districtParts = Object.entries(BOOTH_MASTER_MAP)
        .filter(([_, info]) => info.district.toLowerCase() === district.toLowerCase())
        .map(([p]) => p);

      if (districtParts.length > 0) {
        query = query.in('part_number', districtParts);
      } else {
        query = query.eq('district', district);
      }
    }

    if (taluk) {
      // Find all part numbers for this taluk from BOOTH_MASTER_MAP
      const talukParts = Object.entries(BOOTH_MASTER_MAP)
        .filter(([_, info]) =>
          info.taluk.toLowerCase() === taluk.toLowerCase() ||
          info.taluk.toLowerCase().includes(taluk.toLowerCase()) ||
          taluk.toLowerCase().includes(info.taluk.toLowerCase()) ||
          info.ac_name.toLowerCase() === taluk.toLowerCase()
        )
        .map(([p]) => p);

      if (talukParts.length > 0) {
        query = query.in('part_number', talukParts);
      } else {
        query = query.or(`taluk.ilike.%${taluk}%,polling_station_name.ilike.%${taluk}%`);
      }
    }

    if (ac) {
      // Find all part numbers for this Assembly Constituency from authoritative BOOTH_MASTER_MAP
      const cleanAc = ac.replace(/[\.\s_-]/g, '').toLowerCase();
      const acParts = Object.entries(BOOTH_MASTER_MAP)
        .filter(([_, info]) => {
          const infoCleanAc = info.ac_name.replace(/[\.\s_-]/g, '').toLowerCase();
          const infoCleanTaluk = info.taluk.replace(/[\.\s_-]/g, '').toLowerCase();
          return (
            infoCleanAc === cleanAc ||
            info.ac_name.toLowerCase() === ac.toLowerCase() ||
            infoCleanTaluk === cleanAc ||
            info.taluk.toLowerCase() === ac.toLowerCase() ||
            info.ac_name.toLowerCase().includes(ac.toLowerCase()) ||
            ac.toLowerCase().includes(info.ac_name.toLowerCase())
          );
        })
        .map(([p]) => p);

      if (acParts.length > 0) {
        query = query.in('part_number', acParts);
      } else {
        query = query.or(`ac_name.eq.${ac},ac_name.ilike.%${ac}%`);
      }
    }
    if (part) {
      query = query.eq('part_number', part);
    }
    if (village) {
      query = query.ilike('village', `%${village}%`);
    }

    // Sorting: In booth mode, sort by serial_number ascending for voter slip sequence
    const offset = (page - 1) * pageSize;
    if (queryType === 'booth') {
      query = query
        .order('serial_number', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
    } else {
      query = query
        .order('part_number', { ascending: true, nullsFirst: false })
        .order('serial_number', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
    }

    // Fetch booth metadata if searching or filtering by part
    let boothInfo: SearchApiResponse['boothInfo'] = null;
    if (part) {
      const { data: boothSample } = await supabase
        .from('electors')
        .select('part_number, polling_station_name, polling_address')
        .eq('part_number', part)
        .limit(1)
        .maybeSingle();

      if (boothSample) {
        boothInfo = {
          part_number: boothSample.part_number || part,
          polling_station_name: boothSample.polling_station_name,
          polling_address: boothSample.polling_address,
        };
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase search query error:', error);
      return NextResponse.json(
        { error: `Search database error: ${error.message}` },
        { status: 500 }
      );
    }

    // 5. Apply privacy sanitization and resolve location & serial number
    const sanitizedRows: SearchResultRow[] = (data || []).map((row) => {
      const electorRow = row as SearchResultRow;
      const location = resolveElectorLocation(electorRow);
      const serial = resolveElectorSerialNumber(electorRow);

      return {
        ...electorRow,
        serial_number: serial,
        taluk: location.taluk,
        district: location.district,
        ac_name: location.ac_name,
        whatsapp_mob: isPublic ? null : maskMobile(electorRow.whatsapp_mob, auth.session.role),
      };
    });

    const durationMs = Math.round(performance.now() - startTime);

    const responsePayload: SearchApiResponse = {
      rows: sanitizedRows,
      total: isEpicQuery ? sanitizedRows.length : (count ?? 0),
      page,
      pageSize,
      queryType,
      durationMs,
      boothInfo,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal search server error';
    console.error('Search endpoint exception:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
