import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError, maskMobile } from '@/lib/auth/roles';
import { searchQuerySchema } from '@/features/search/schema';
import { SearchApiResponse, SearchResultRow, SearchQueryType } from '@/features/search/types';
import { normalizeEpic, isValidEpic, isSyntheticEpic, cleanIndianMobile, sanitizeDisplayLocation, formatElectorFullName } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber, BOOTH_MASTER_MAP } from '@/lib/boothMaster';
import { resolveElectorPhone, findEpicsByPhone } from '@/lib/phoneMaster';
import { searchElectorsLocal } from '@/lib/sqliteElectors';

export const dynamic = 'force-dynamic';

// High-concurrency in-memory sliding window rate limiter per user/IP
// Allows up to 240 requests per minute per user session (plenty for active typing and searching)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

// Periodic cleanup of expired rate limit buckets to avoid memory buildup under high traffic
let lastRateLimitCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastRateLimitCleanup > 60000) {
    lastRateLimitCleanup = now;
    rateLimitMap.forEach((bucket, key) => {
      if (now > bucket.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }
}

function checkRateLimit(key: string, limit = 240, windowMs = 60000): boolean {
  cleanupRateLimitMap();
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

// High-speed In-Memory Response Cache for repeated popular queries (60s TTL)
interface SearchCacheEntry {
  data: SearchApiResponse;
  expiresAt: number;
}
const searchResponseCache = new Map<string, SearchCacheEntry>();
const MAX_SEARCH_CACHE_SIZE = 500;

function getCachedSearch(cacheKey: string): SearchApiResponse | null {
  const entry = searchResponseCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchResponseCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

function setCachedSearch(cacheKey: string, data: SearchApiResponse, ttlMs = 60000) {
  if (searchResponseCache.size >= MAX_SEARCH_CACHE_SIZE) {
    // Purge oldest entries if cache limit reached
    const oldestKey = searchResponseCache.keys().next().value;
    if (oldestKey) searchResponseCache.delete(oldestKey);
  }
  searchResponseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Sanitize search inputs to prevent PostgREST syntax errors and filter injection in .or() expressions.
 * Strips PostgREST control characters: commas, parentheses, quotes, backslashes, semicolons.
 */
function sanitizePostgrestTerm(term: string): string {
  return term.replace(/[,()"'\\;]/g, ' ').replace(/\s+/g, ' ').trim();
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

  if (!checkRateLimit(rateLimitKey, 240, 60000)) {
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

  const { q, relativeName, mobile, part, ac, district, taluk, village, fuzzy, page, pageSize } = parseResult.data;

  // Cache key for public lookups (exact match on query & filter combination)
  const cacheKey = `${q.trim().toLowerCase()}|${relativeName.trim().toLowerCase()}|${mobile || ''}|${part || ''}|${ac || ''}|${district || ''}|${taluk || ''}|${village || ''}|${Boolean(fuzzy)}|${page}|${pageSize}|${isPublic ? 'pub' : auth.session.role}`;
  const cachedResponse = getCachedSearch(cacheKey);
  if (cachedResponse) {
    return NextResponse.json({
      ...cachedResponse,
      durationMs: Math.round(performance.now() - startTime),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'HIT',
      },
    });
  }

  // 3b. High-performance local search via SQLite (< 15ms)
  try {
    const localResult = searchElectorsLocal(parseResult.data);
    if (localResult) {
      setCachedSearch(cacheKey, localResult, 60000);
      return NextResponse.json(localResult, {
        headers: {
          'Cache-Control': isPublic
            ? 'public, s-maxage=30, stale-while-revalidate=60'
            : 'private, no-cache',
          'X-Cache': 'LOCAL_SQLITE',
        },
      });
    }
  } catch (sqliteErr) {
    console.warn('Local search skipped, falling back to remote database:', sqliteErr);
  }

  try {
    const supabase = createAdminClient();

    // 4. Smart Query Router:
    // Determine query strategy: EPIC -> Mobile -> Relative -> Name -> Booth -> Filter-only
    let queryType: SearchQueryType = 'filter';
    const trimmedQ = q.trim();
    const trimmedRel = relativeName.trim();
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
      : supabase.from('electors').select(selectColumns, { count: 'planned' });

    const safeQ = sanitizePostgrestTerm(trimmedQ);
    const safeRel = sanitizePostgrestTerm(trimmedRel);

    // Mode A: Exact EPIC card number format (indexed lookup, supports 7-13 char cards and 0-padded variants)
    if (isEpicQuery) {
      queryType = 'epic';
      const variants = [normalizedQEpic];
      const m6 = normalizedQEpic.match(/^([A-Z]{2,4})(\d{6})$/);
      if (m6) variants.push(`${m6[1]}0${m6[2]}`);
      const m7 = normalizedQEpic.match(/^([A-Z]{2,4})0(\d{6})$/);
      if (m7) variants.push(`${m7[1]}${m7[2]}`);

      if (variants.length > 1) {
        query = query.in('epic_number', variants);
      } else {
        query = query.eq('epic_number', normalizedQEpic);
      }
      query = query.limit(20);
    }
    // Mode B1: 10-digit Mobile number (or partial 5+ digit phone search)
    else if (
      /^\d{5,12}$/.test(trimmedQ) ||
      (mobile && /^\d{5,12}$/.test(mobile.replace(/\D/g, '')))
    ) {
      queryType = 'mobile';
      const phoneDigits = /^\d{5,12}$/.test(trimmedQ)
        ? trimmedQ
        : mobile.replace(/\D/g, '');
      const matchedEpics = findEpicsByPhone(phoneDigits);
      if (matchedEpics.length > 0) {
        query = query.in('epic_number', matchedEpics.slice(0, 50));
      } else {
        query = query.ilike('whatsapp_mob', `%${phoneDigits}%`);
      }
    }
    // Mode B2: Compound Booth + Serial query (e.g. "103 347", "103/347", "Part 103 Serial 347", "Booth 103 - 347")
    else if (/^(?:part|booth)?\s*(\d{1,4})\s*[\s/,-]+\s*(?:serial|sl|s#?|no\.?)?\s*(\d{1,4})$/i.test(trimmedQ)) {
      queryType = 'booth';
      const m = trimmedQ.match(/^(?:part|booth)?\s*(\d{1,4})\s*[\s/,-]+\s*(?:serial|sl|s#?|no\.?)?\s*(\d{1,4})$/i)!;
      const extractedPart = m[1];
      const extractedSerial = parseInt(m[2], 10);
      query = query.eq('part_number', extractedPart).eq('serial_number', extractedSerial);
    }
    // Mode B3: Explicit Serial Number query (e.g. "Serial 347", "sl 347", "#347", "S# 347")
    else if (/^(?:serial|sl|s#?|no\.?|#)\s*(\d{1,5})$/i.test(trimmedQ)) {
      queryType = 'booth';
      const m = trimmedQ.match(/^(?:serial|sl|s#?|no\.?|#)\s*(\d{1,5})$/i)!;
      const extractedSerial = parseInt(m[1], 10);
      if (part) {
        query = query.eq('part_number', part).eq('serial_number', extractedSerial);
      } else {
        query = query.eq('serial_number', extractedSerial);
      }
    }
    // Mode B4: Numeric Serial entered with Booth/Part filter selected (e.g. part="103" and q="347")
    else if (/^\d{1,5}$/.test(trimmedQ) && part) {
      queryType = 'booth';
      query = query.eq('serial_number', parseInt(trimmedQ, 10));
    }
    // Mode B5: Standalone numeric serial (e.g. q="347" without part filter)
    else if (/^\d{1,5}$/.test(trimmedQ)) {
      queryType = 'booth';
      query = query.or(`serial_number.eq.${parseInt(trimmedQ, 10)},name.ilike.%${safeQ}%`);
    }
    // Mode C1: Dedicated Relative / Father / Husband Name search entered
    else if (safeRel.length > 0) {
      const hasAnyFilter = Boolean(part || ac || district || taluk || village);
      if (safeRel.length < 2 && safeQ.length < 2 && !hasAnyFilter) {
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

      queryType = 'name';

      if (safeQ.length > 0) {
        // User entered both Elector Name AND Relative Name (e.g. name = Sushma, relative = Satyamurthy)
        const qNoSpace = safeQ.replace(/\s+/g, '');
        if (qNoSpace !== safeQ && qNoSpace.length >= 2) {
          query = query
            .or(`name.ilike.%${safeQ}%,name.ilike.%${qNoSpace}%`)
            .ilike('relative_name', `%${safeRel}%`);
        } else {
          query = query
            .ilike('name', `%${safeQ}%`)
            .ilike('relative_name', `%${safeRel}%`);
        }
      } else {
        // User entered only Relative Name (e.g. relative = Satyamurthy)
        query = query.ilike('relative_name', `%${safeRel}%`);
      }
    }
    // Mode C2: Name or Location text search in main bar (with intelligent relative name cross-matching & fuzzy)
    else if (safeQ.length > 0) {
      // Guard against slow 1-character full-table scans across 192k records unless filtered
      const hasAnyFilter = Boolean(part || ac || district || taluk || village);
      if (safeQ.length < 2 && !hasAnyFilter) {
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
            .eq('variant', safeQ.toLowerCase())
            .maybeSingle();
          if (translitData?.canonical) {
            canonicalTerm = sanitizePostgrestTerm(translitData.canonical);
          }
        } catch {
          // Non-blocking fallback
        }
      }

      // Check if user entered a known location name (AC, Taluk, Booth area, e.g. "KGF", "Robertsonpet")
      const cleanQ = safeQ.replace(/[\.\s_-]/g, '').toLowerCase();
      const matchedLocationParts = Object.entries(BOOTH_MASTER_MAP)
        .filter(([_, info]) => {
          const infoAc = info.ac_name.replace(/[\.\s_-]/g, '').toLowerCase();
          const infoTaluk = info.taluk.replace(/[\.\s_-]/g, '').toLowerCase();
          const infoDist = info.district.replace(/[\.\s_-]/g, '').toLowerCase();
          return (
            infoAc === cleanQ ||
            infoTaluk === cleanQ ||
            infoDist === cleanQ ||
            info.ac_name.toLowerCase().includes(safeQ.toLowerCase()) ||
            info.taluk.toLowerCase().includes(safeQ.toLowerCase())
          );
        })
        .map(([p]) => p);

      if (matchedLocationParts.length > 0 && safeQ.length <= 20) {
        // Broaden search to include electors in this location or with this name
        query = query.or(
          `part_number.in.(${matchedLocationParts.join(',')}),name.ilike.%${safeQ}%,relative_name.ilike.%${safeQ}%,polling_station_name.ilike.%${safeQ}%,polling_address.ilike.%${safeQ}%,address.ilike.%${safeQ}%`
        );
      } else if (canonicalTerm && canonicalTerm.toLowerCase() !== safeQ.toLowerCase()) {
        query = query.or(
          `name.ilike.%${safeQ}%,name.ilike.%${canonicalTerm}%,relative_name.ilike.%${safeQ}%,relative_name.ilike.%${canonicalTerm}%`
        );
      } else {
        // Intelligent cross-matching: if user typed multiple words (e.g. "Sushma Satyamurthy"),
        // check whether one word matches the elector's name and another matches the relative's name:
        const words = safeQ.split(/\s+/).filter(w => w.length >= 2);
        const qNoSpace = safeQ.replace(/\s+/g, '');
        if (words.length >= 2) {
          const [w1, w2] = words;
          const multiOr = [
            `name.ilike.%${safeQ}%`,
            `relative_name.ilike.%${safeQ}%`,
            `name.ilike.%${qNoSpace}%`,
            `and(name.ilike.%${w1}%,relative_name.ilike.%${w2}%)`,
            `and(name.ilike.%${w2}%,relative_name.ilike.%${w1}%)`,
          ];
          if (words.length >= 3) {
            const wLast = words[words.length - 1];
            multiOr.push(`and(name.ilike.%${w1}%,relative_name.ilike.%${wLast}%)`);
            multiOr.push(`and(name.ilike.%${wLast}%,relative_name.ilike.%${w1}%)`);
          }
          query = query.or(multiOr.join(','));
        } else {
          query = query.or(`name.ilike.%${safeQ}%,relative_name.ilike.%${safeQ}%`);
        }
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
        const safeTaluk = sanitizePostgrestTerm(taluk);
        query = query.or(`taluk.ilike.%${safeTaluk}%,polling_station_name.ilike.%${safeTaluk}%`);
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
        const safeAc = sanitizePostgrestTerm(ac);
        query = query.or(`ac_name.eq.${safeAc},ac_name.ilike.%${safeAc}%`);
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

    let data: any[] | null = null;
    let count: number | null = null;
    let queryError: any = null;

    try {
      const timeoutPromise = new Promise<{ data: any; count: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Remote database query timed out (8s)')), 8000)
      );
      const res = (await Promise.race([query, timeoutPromise])) as any;
      data = res.data;
      count = res.count;
      queryError = res.error;
    } catch (e: any) {
      console.warn('Supabase query timed out or failed:', e?.message || e);
      queryError = e;
    }

    if (queryError || !data) {
      console.warn('Returning graceful empty results for search query:', q);
      return NextResponse.json({
        rows: [],
        total: 0,
        page,
        pageSize,
        queryType,
        durationMs: Math.round(performance.now() - startTime),
        boothInfo: boothInfo || null,
      });
    }

    // 5. Apply privacy sanitization, clean synthetic epics to blank, and resolve location & serial number
    const sanitizedRows: SearchResultRow[] = (data || []).map((row) => {
      const electorRow = row as SearchResultRow;
      const location = resolveElectorLocation(electorRow);
      const serial = resolveElectorSerialNumber(electorRow);
      const isSynthetic = isSyntheticEpic(electorRow.epic_number);
      const cleanEpic = isSynthetic ? '' : (electorRow.epic_number || '');
      const phone = resolveElectorPhone({
        ...electorRow,
        epic_number: cleanEpic || electorRow.epic_number,
      });

      return {
        ...electorRow,
        name: electorRow.name ? formatElectorFullName(electorRow.name) : '',
        relative_name: electorRow.relative_name ? formatElectorFullName(electorRow.relative_name) : null,
        epic_number: cleanEpic,
        serial_number: serial,
        taluk: location.taluk,
        district: location.district,
        ac_name: location.ac_name,
        whatsapp_mob: cleanIndianMobile(phone),
        polling_station_name: sanitizeDisplayLocation(electorRow.polling_station_name) || null,
        polling_address: sanitizeDisplayLocation(electorRow.polling_address) || null,
        address: sanitizeDisplayLocation(electorRow.address) || null,
      };
    });

    // 6. Zero-Duplication Filter: deduplicate any identical electors in search results
    const seenSlots = new Set<string>();
    const seenPeople = new Set<string>();
    const deduplicatedRows: SearchResultRow[] = [];

    for (const r of sanitizedRows) {
      const partKey = String(r.part_number || '').trim();
      const serialKey = r.serial_number !== null && r.serial_number !== undefined ? String(r.serial_number).trim() : '';
      const nameKey = (r.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const relKey = (r.relative_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (partKey && serialKey) {
        const slotKey = `${partKey}:${serialKey}`;
        if (seenSlots.has(slotKey)) continue;
        seenSlots.add(slotKey);
      }
      if (partKey && nameKey && relKey) {
        const personKey = `${partKey}:${nameKey}:${relKey}`;
        if (seenPeople.has(personKey)) continue;
        seenPeople.add(personKey);
      }
      deduplicatedRows.push(r);
    }

    const durationMs = Math.round(performance.now() - startTime);

    const responsePayload: SearchApiResponse = {
      rows: deduplicatedRows,
      total: isEpicQuery ? deduplicatedRows.length : (count ?? 0),
      page,
      pageSize,
      queryType,
      durationMs,
      boothInfo,
    };

    // Store in memory cache for subsequent instant hits
    setCachedSearch(cacheKey, responsePayload, 60000);

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': isPublic
          ? 'public, s-maxage=30, stale-while-revalidate=60'
          : 'private, no-cache',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal search server error';
    console.error('Search endpoint exception:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
