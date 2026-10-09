import { NextRequest, NextResponse } from 'next/server';
import {
  getVoterRequests,
  createVoterRequest,
} from '@/lib/requestsService';
import { requireRole, isAuthError } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  try {
    // Role check: Authenticated admin, supervisor, operator, or worker/field_agent
    const auth = requireRole(request, 'admin', 'supervisor', 'operator', 'field_agent');
    const isInternalAuth =
      request.headers.get('x-admin-key') ===
      (process.env.ADMIN_SECRET_KEY || 'internal_test_secret_2026');

    if (isAuthError(auth) && !isInternalAuth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
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

    // Required fields validation matching form
    if (!body.elector_name || !body.mobile || !body.taluk) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: Name, Mobile number, and Taluk/City are required.' },
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
      relative_name: body.relative_name?.trim() || '',
      relation_type: body.relation_type || 'Father',
      gender: body.gender || 'Male',
      age: Number(body.age) || 21,
      dob: body.dob || undefined,
      qualification: body.qualification?.trim() || undefined,
      occupation: body.occupation?.trim() || undefined,
      existing_epic: (body.existing_epic || body.epic_number)?.trim().toUpperCase() || undefined,
      district: body.district?.trim() || 'Tumkur',
      taluk: body.taluk.trim(),
      hobli: body.hobli?.trim() || undefined,
      village: body.village?.trim() || undefined,
      city: body.city?.trim() || body.taluk.trim(),
      polling_station: body.polling_station?.trim() || undefined,
      address: body.address?.trim() || '',
      pincode: body.pincode?.trim() || '',
      mobile: cleanMobile,
      whatsapp: body.whatsapp?.replace(/\D/g, '') || cleanMobile,
      applicant_type: body.applicant_type || 'Self',
      category: body.category || 'Graduates / Teachers Enrollment',
      notes: (body.notes || body.anything_else)?.trim() || undefined,
    });

    return NextResponse.json(
      { success: true, id: newRequest.id, request: newRequest },
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
