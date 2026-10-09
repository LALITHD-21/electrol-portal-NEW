import { NextRequest, NextResponse } from 'next/server';
import {
  getVoterRequests,
  updateVoterRequestStatus,
} from '@/lib/requestsService';
import { RequestStatus, canTransition } from '@/lib/status-map';
import { requireRole, isAuthError } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
  try {
    const isInternal =
      request.headers.get('x-admin-key') ===
      (process.env.ADMIN_SECRET_KEY || 'internal_test_secret_2026');
    const auth = requireRole(request, 'admin', 'supervisor', 'operator');

    if (!isInternal && isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { requestIds, targetStatus, batchNote, actorId } = body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one Request ID must be selected for bulk action.' },
        { status: 400 }
      );
    }

    // Disallow bulk enrolled or bulk rejected (Section 5.5 strict rule)
    if (['enrolled', 'rejected'].includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Bulk action not permitted for "${targetStatus}". Individual documentary review and verification are strictly required.`,
        },
        { status: 400 }
      );
    }

    const { requests } = await getVoterRequests();
    const selected = requests.filter((r) => requestIds.includes(r.id));

    if (selected.length === 0) {
      return NextResponse.json({ error: 'No matching requests found.' }, { status: 404 });
    }

    // Verify all selected requests have the EXACT SAME starting status
    const firstStatus = selected[0].status;
    const allSameStatus = selected.every((r) => r.status === firstStatus);

    if (!allSameStatus) {
      return NextResponse.json(
        {
          error:
            'Bulk transition rejected: All selected requests must share the same current status. Please filter and select uniform requests.',
        },
        { status: 400 }
      );
    }

    if (!canTransition(firstStatus, targetStatus as RequestStatus)) {
      return NextResponse.json(
        {
          error: `Illegal bulk transition from "${firstStatus}" to "${targetStatus}".`,
        },
        { status: 400 }
      );
    }

    // Execute transitions
    const updatedResults = [];
    for (const item of selected) {
      const updated = await updateVoterRequestStatus(item.id, {
        status: targetStatus as RequestStatus,
        actor_id: actorId || 'bulk_operator',
        reviewed_by: 'Bulk Operations Desk',
        internal_note: batchNote || `Bulk transition to ${targetStatus}`,
        public_visible: true,
      });
      updatedResults.push(updated);
    }

    return NextResponse.json({
      success: true,
      count: updatedResults.length,
      targetStatus,
    });
  } catch (error: any) {
    console.error('Error during bulk status transition:', error);
    return NextResponse.json(
      { error: error.message || 'Bulk transition failed' },
      { status: 500 }
    );
  }
}
