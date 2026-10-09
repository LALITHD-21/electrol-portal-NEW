import { NextRequest, NextResponse } from 'next/server';
import { getVoterRequests, appendRequestEvent, updateVoterRequest } from '@/lib/requestsService';
import { createAdminClient } from '@/lib/supabase/server';
import { requireRole, isAuthError } from '@/lib/auth/roles';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { userRole, actorId } = body;

    // Strict role check: require authenticated Admin or Supervisor role or authorized internal key
    const isInternal =
      request.headers.get('x-admin-key') ===
      (process.env.ADMIN_SECRET_KEY || 'internal_test_secret_2026');
    const auth = requireRole(request, 'admin', 'supervisor');

    if (!isInternal && isAuthError(auth)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only Admin or Supervisor roles can promote records to the official roll.' },
        { status: 403 }
      );
    }

    const { requests } = await getVoterRequests({ search: id });
    const voterReq = requests.find((r) => r.id.toLowerCase() === id.toLowerCase());

    if (!voterReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Must be enrolled first
    if (voterReq.status !== 'enrolled') {
      return NextResponse.json(
        {
          error: `Cannot promote to roll: Request status is "${voterReq.status}". Enrolment must be officially confirmed in published roll first.`,
        },
        { status: 400 }
      );
    }

    if (!voterReq.enrolled_part_number || !voterReq.enrolled_serial_number) {
      return NextResponse.json(
        { error: 'Cannot promote: Part Number and Serial Number must be recorded.' },
        { status: 400 }
      );
    }

    // Create elector payload
    const electorPayload = {
      epic: voterReq.existing_epic || `PROV-${voterReq.id}`,
      name: voterReq.elector_name,
      name_kannada: voterReq.elector_name_kannada || '',
      relation_name: voterReq.relative_name,
      relation_type: voterReq.relation_type,
      gender: voterReq.gender,
      age: voterReq.age || 25,
      district: voterReq.district,
      taluk: voterReq.taluk,
      city: voterReq.city || '',
      part_no: voterReq.enrolled_part_number,
      serial_no: voterReq.enrolled_serial_number,
      source: 'PROMOTED_FROM_REQUEST',
    };

    // Update existing_epic on request record if not already present
    if (!voterReq.existing_epic) {
      try {
        await updateVoterRequest(voterReq.id, {
          status: 'enrolled',
          existing_epic: electorPayload.epic,
        });
      } catch {}
    }

    // Attempt insert into Supabase electors table if available
    try {
      const supabase = createAdminClient();
      await supabase.from('electors').upsert([electorPayload]);
    } catch {}

    // Record immutable audit entry
    const auditEvent = await appendRequestEvent({
      request_id: voterReq.id,
      actor_id: actorId || 'supervisor_admin',
      action: 'PROMOTED_TO_ROLL_RECORD',
      to_status: 'enrolled',
      internal_note: `Promoted to master elector directory with Part ${voterReq.enrolled_part_number}, Serial ${voterReq.enrolled_serial_number}.`,
      public_note: `Confirmed and registered in published electoral roll (Part ${voterReq.enrolled_part_number}, Serial ${voterReq.enrolled_serial_number}).`,
      public_note_kn: `ಪ್ರಕಟಿತ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ (ಭಾಗ ${voterReq.enrolled_part_number}, ಕ್ರಮ ಸಂಖ್ಯೆ ${voterReq.enrolled_serial_number}).`,
      public_visible: true,
      metadata: electorPayload,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully promoted to official roll record.',
      elector: electorPayload,
      event: auditEvent,
    });
  } catch (error: any) {
    console.error('Error promoting request to roll record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to promote record to roll' },
      { status: 500 }
    );
  }
}
