import { NextRequest, NextResponse } from 'next/server';
import {
  getVoterRequests,
  createVoterRequest,
} from '@/lib/requestsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || undefined;
    const taluk = searchParams.get('taluk') || undefined;
    const city = searchParams.get('city') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const data = await getVoterRequests({
      district,
      taluk,
      city,
      status,
      search,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching voter requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voter requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Required fields validation
    if (!body.elector_name || !body.relative_name || !body.gender || !body.district || !body.taluk || !body.mobile) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: Name, Relative, Gender, District, Taluk, and Mobile number are required.' },
        { status: 400 }
      );
    }

    // Mobile number validation
    const cleanMobile = String(body.mobile).replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Please provide a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const newRequest = await createVoterRequest({
      elector_name: body.elector_name.trim(),
      elector_name_kannada: body.elector_name_kannada?.trim() || undefined,
      relative_name: body.relative_name.trim(),
      relation_type: body.relation_type || 'Father',
      gender: body.gender,
      age: Number(body.age) || 18,
      dob: body.dob || undefined,
      existing_epic: body.existing_epic?.trim().toUpperCase() || undefined,
      district: body.district.trim(),
      taluk: body.taluk.trim(),
      city: body.city?.trim() || 'Town/Ward',
      polling_station: body.polling_station?.trim() || undefined,
      address: body.address?.trim() || '',
      pincode: body.pincode?.trim() || '',
      mobile: cleanMobile,
      whatsapp: body.whatsapp?.replace(/\D/g, '') || cleanMobile,
      applicant_type: body.applicant_type || 'Self',
      category: body.category || 'New Registration (Form 6)',
      notes: body.notes?.trim() || undefined,
    });

    return NextResponse.json(
      { success: true, request: newRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating voter request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create voter request' },
      { status: 500 }
    );
  }
}
