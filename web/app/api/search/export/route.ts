import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { searchQuerySchema } from '@/features/search/schema';
import { normalizeEpic, isValidEpic } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  // 1. Strict security check: admin & operator only
  const auth = requireRole(request, 'admin', 'operator');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 2. Validate query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = searchQuerySchema.safeParse(searchParams);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid export parameters' },
      { status: 400 }
    );
  }

  const { q, mobile, part, ac, district, village, pageSize } = parseResult.data;

  try {
    const supabase = createAdminClient();

    let query = supabase.from('electors').select(`
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
    `);

    const trimmedQ = q.trim();
    const normalizedEpic = normalizeEpic(trimmedQ);

    if (isValidEpic(normalizedEpic)) {
      query = query.eq('epic_number', normalizedEpic);
    } else if (/^\d{10}$/.test(trimmedQ) || (mobile && /^\d{10}$/.test(mobile))) {
      const phoneDigits = /^\d{10}$/.test(trimmedQ) ? trimmedQ : mobile.replace(/\D/g, '');
      query = query.ilike('whatsapp_mob', `%${phoneDigits}%`);
    } else if (trimmedQ.length > 0) {
      query = query.or(`name.ilike.%${trimmedQ}%,relative_name.ilike.%${trimmedQ}%`);
    }

    if (district) query = query.eq('district', district);
    if (ac) query = query.eq('ac_name', ac);
    if (part) query = query.eq('part_number', part);
    if (village) query = query.ilike('village', `%${village}%`);

    // Limit export to current page size (max 500 rows for safety)
    const exportLimit = Math.min(Math.max(pageSize, 50), 500);
    query = query
      .order('part_number', { ascending: true, nullsFirst: false })
      .order('serial_number', { ascending: true, nullsFirst: false })
      .limit(exportLimit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase export query error:', error);
      return NextResponse.json({ error: `Export error: ${error.message}` }, { status: 500 });
    }

    const rows = data || [];

    // Construct CSV
    const headers = [
      'Serial No',
      'EPIC Number',
      'Name',
      'Relative Name',
      'Age',
      'Sex',
      'WhatsApp / Mobile',
      'District',
      'Assembly (AC)',
      'Taluk',
      'Village / Ward',
      'Part Number',
      'Polling Station',
      'Address',
    ];

    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = [
        escapeCsvCell(row.serial_number),
        escapeCsvCell(row.epic_number),
        escapeCsvCell(row.name),
        escapeCsvCell(row.relative_name),
        escapeCsvCell(row.age),
        escapeCsvCell(row.sex),
        escapeCsvCell(row.whatsapp_mob),
        escapeCsvCell(row.district),
        escapeCsvCell(row.ac_name),
        escapeCsvCell(row.taluk),
        escapeCsvCell(row.village),
        escapeCsvCell(row.part_number),
        escapeCsvCell(row.polling_station_name),
        escapeCsvCell(row.address),
      ];
      csvLines.push(line.join(','));
    }

    const csvOutput = csvLines.join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `voters_export_${part ? `part_${part}_` : ''}${timestamp}.csv`;

    return new NextResponse(csvOutput, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating export';
    console.error('Export route exception:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
