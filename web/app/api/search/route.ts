import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError, maskMobile } from '@/lib/auth/roles';
import { searchQuerySchema } from '@/features/search/schema';
import { SearchApiResponse, SearchResultRow, SearchQueryType } from '@/features/search/types';
import { normalizeEpic, isValidEpic } from '@/lib/utils';

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

  // 1. Role-based security check
  const auth = requireRole(request, 'admin', 'operator', 'field_agent');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 2. Rate limiting check per user
  const rateLimitKey = auth.session.userId || auth.session.username || 'anon_search';
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

  const { q, mobile, part, ac, district, village, fuzzy, page, pageSize } = parseResult.data;

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
      address
    `;

    let query = supabase.from('electors').select(selectColumns, { count: 'exact' });

    // Mode A: Exact EPIC card number format
    if (isValidEpic(normalizedQEpic)) {
      queryType = 'epic';
      query = query.eq('epic_number', normalizedQEpic);
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
    // Mode C: Name text search (with optional fuzzy transliteration expansion)
    else if (trimmedQ.length > 0) {
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

      if (canonicalTerm && canonicalTerm.toLowerCase() !== trimmedQ.toLowerCase()) {
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

    // Apply Filter dropdowns (District, AC, Part, Village)
    if (district) {
      query = query.eq('district', district);
    }
    if (ac) {
      query = query.eq('ac_name', ac);
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

    // 5. Apply role-based data sanitization (Mask mobile for field_agent)
    const role = auth.session.role;
    const sanitizedRows: SearchResultRow[] = (data || []).map((row) => {
      const electorRow = row as SearchResultRow;
      return {
        ...electorRow,
        whatsapp_mob: maskMobile(electorRow.whatsapp_mob, role),
      };
    });

    const durationMs = Math.round(performance.now() - startTime);

    const responsePayload: SearchApiResponse = {
      rows: sanitizedRows,
      total: count ?? 0,
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
