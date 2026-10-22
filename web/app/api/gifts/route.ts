import { NextRequest, NextResponse } from 'next/server';
import { getAllGiftRecords, issueGiftDistribution } from '@/lib/gift-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const epic = searchParams.get('epic')?.trim().toUpperCase();
    const boothPart = searchParams.get('part')?.trim();

    const giftMap = await getAllGiftRecords();
    const allRecords = Array.from(giftMap.values());

    if (epic) {
      const record = giftMap.get(epic);
      return NextResponse.json({
        hasGift: Boolean(record),
        record: record || null,
      });
    }

    const filteredRecords = boothPart
      ? allRecords.filter((r) => r.booth_part === boothPart || r.part_number === boothPart)
      : allRecords;

    return NextResponse.json({
      totalDelivered: allRecords.length,
      boothDelivered: filteredRecords.length,
      records: filteredRecords.slice(0, 500),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch gift records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      epic_number,
      elector_name,
      relative_name,
      part_number,
      serial_number,
      district,
      taluk,
      polling_station_name,
      volunteer_name,
      volunteer_phone,
      recipient_mobile,
      notes,
    } = body;

    if (!epic_number || !elector_name || !part_number) {
      return NextResponse.json(
        { error: 'Missing required elector fields (epic_number, elector_name, part_number)' },
        { status: 400 }
      );
    }

    const result = await issueGiftDistribution({
      epic_number,
      elector_name,
      relative_name,
      part_number: String(part_number),
      serial_number: String(serial_number || '1'),
      district: district || 'Karnataka',
      taluk: taluk || 'Karnataka',
      polling_station_name,
      volunteer_name: volunteer_name || 'Campaign Volunteer',
      volunteer_phone,
      recipient_mobile,
      booth_part: String(part_number),
      notes,
    });

    if (result.alreadyIssued) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_GIFT_BLOCKED',
          message: `This voter has already received a gift on ${new Date(
            result.record.issued_at
          ).toLocaleDateString()} issued by ${result.record.volunteer_name}!`,
          record: result.record,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Gift handover recorded successfully.',
        record: result.record,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to record gift distribution' },
      { status: 500 }
    );
  }
}
