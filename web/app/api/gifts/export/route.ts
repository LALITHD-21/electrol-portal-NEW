import { NextRequest, NextResponse } from 'next/server';
import { getAllGiftRecords } from '@/lib/gift-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const giftMap = await getAllGiftRecords();
    const records = Array.from(giftMap.values()).sort(
      (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    );

    const headers = [
      'Sl No',
      'EPIC Number',
      'Voter Name',
      'Relative Name',
      'Part Number',
      'Serial Number',
      'District',
      'Taluk',
      'Polling Station',
      'Volunteer Name',
      'Recipient Mobile',
      'Status',
      'Issued Timestamp',
    ];

    const csvRows = [headers.join(',')];

    records.forEach((r, idx) => {
      const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csvRows.push([
        idx + 1,
        escape(r.epic_number),
        escape(r.elector_name),
        escape(r.relative_name),
        escape(r.part_number),
        escape(r.serial_number),
        escape(r.district),
        escape(r.taluk),
        escape(r.polling_station_name),
        escape(r.volunteer_name),
        escape(r.recipient_mobile),
        escape(r.delivery_status),
        escape(r.issued_at),
      ].join(','));
    });

    const csvString = csvRows.join('\r\n');

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="MLC_2026_Gifts_Delivered_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate gift export' }, { status: 500 });
  }
}
