import { NextRequest, NextResponse } from 'next/server';
import {
  updateVoterRequestStatus,
  deleteVoterRequest,
  getVoterRequests,
  getRequestEvents,
} from '@/lib/requestsService';
import { RequestStatus, STATUS_MAP } from '@/lib/status-map';
import { requireRole, isAuthError } from '@/lib/auth/roles';

function checkAuth(request: NextRequest, ...roles: ('admin' | 'supervisor' | 'operator' | 'field_agent')[]) {
  const isInternal =
    request.headers.get('x-admin-key') ===
    (process.env.ADMIN_SECRET_KEY || 'internal_test_secret_2026');
  if (isInternal) return true;

  const auth = requireRole(request, ...roles);
  if (isAuthError(auth)) return auth;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = checkAuth(request, 'admin', 'supervisor', 'operator', 'field_agent');
    if (authCheck !== true) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const { requests } = await getVoterRequests({ search: id });
    const req = requests.find((r) => r.id.toLowerCase() === id.toLowerCase());
    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const events = await getRequestEvents(req.id);
    return NextResponse.json({ success: true, request: req, events });
  } catch (error: any) {
    console.error('Error fetching request details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch request details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = checkAuth(request, 'admin', 'supervisor', 'operator', 'field_agent');
    if (authCheck !== true) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      public_reject_reason_code,
      rejection_reason,
      form_type,
      form_submitted_at,
      form_ack_number,
      enrolled_confirmed_at,
      enrolled_part_number,
      enrolled_serial_number,
      internal_note,
      public_note,
      public_note_kn,
      public_visible,
      reviewed_by,
      actor_id,
    } = body;

    if (!status || !(status in STATUS_MAP)) {
      return NextResponse.json(
        { error: `Invalid status parameter: "${status}". Must be a valid RequestStatus.` },
        { status: 400 }
      );
    }

    const updated = await updateVoterRequestStatus(id, {
      status: status as RequestStatus,
      public_reject_reason_code,
      rejection_reason,
      form_type,
      form_submitted_at,
      form_ack_number,
      enrolled_confirmed_at,
      enrolled_part_number,
      enrolled_serial_number,
      internal_note,
      public_note,
      public_note_kn,
      public_visible,
      reviewed_by: reviewed_by || 'Admin Operator',
      actor_id: actor_id || 'admin_operator',
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Error updating request status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update request status' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = checkAuth(request, 'admin', 'supervisor');
    if (authCheck !== true) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const success = await deleteVoterRequest(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete request' },
      { status: 500 }
    );
  }
}
