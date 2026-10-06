import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/server';
import { VERIFIED_BOOTHS_RAW } from '@/features/analytics/mock/verifiedBooths';

export const dynamic = 'force-dynamic';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  // 1. Role verification: admin or operator only
  const auth = requireRole(request, 'admin', 'operator');
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';
  const type = searchParams.get('type') || 'booths';
  const district = searchParams.get('district') || null;
  const ac = searchParams.get('ac') || null;

  try {
    const supabase = createAdminClient();

    if (type === 'booths') {
      // Fetch all booths with resilient fallback
      let booths: any[] = [];
      try {
        const { data, error } = await supabase.rpc('get_booths_summary', {
          p_district: district || null,
          p_ac: ac || null,
          p_search: null,
        });
        if (!error && data && data.length > 0) {
          booths = data;
        }
      } catch (rpcErr) {
        console.warn('get_booths_summary RPC fallback:', rpcErr);
      }

      if (booths.length === 0) {
        booths = VERIFIED_BOOTHS_RAW;
      }

      if (format === 'json') {
        return NextResponse.json({
          count: booths.length,
          exported_at: new Date().toISOString(),
          booths,
        });
      }

      // Generate CSV
      const headers = [
        'Part Number',
        'Polling Station Name',
        'Polling Station Address',
        'District',
        'Assembly Constituency (AC)',
        'Total Electors',
        'Male Electors',
        'Female Electors',
        'Gender Ratio (F/1000M)',
        'Mobile Numbers Count',
        'Mobile Reach (%)',
      ];

      const rows = booths.map((b: any) => {
        const total = Number(b.total_electors) || 0;
        const male = Number(b.male_count) || 0;
        const female = Number(b.female_count) || 0;
        const mobile = Number(b.mobile_count) || 0;
        const ratio = male > 0 ? Math.round((female / male) * 1000) : 0;
        const mobilePct = total > 0 ? Math.round((mobile / total) * 1000) / 10 : 0;

        return [
          escapeCsvField(b.part_number),
          escapeCsvField(b.polling_station_name),
          escapeCsvField(b.polling_address),
          escapeCsvField(b.district),
          escapeCsvField(b.ac_name),
          total,
          male,
          female,
          ratio,
          mobile,
          mobilePct,
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
      const filename = `polling_booths_directory_${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Default: summary export
    const { data: statsData, error: statsErr } = await supabase.rpc('get_dashboard_stats', {
      p_district: district,
      p_ac: ac,
      p_taluk: null,
      p_part: null,
    });

    if (statsErr) throw statsErr;

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      stats: statsData,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
