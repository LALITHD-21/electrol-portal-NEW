import { NextRequest, NextResponse } from 'next/server';
import { updateVoterRequestStatus } from '@/lib/requestsService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, rejection_reason, reviewed_by } = body;

    if (!status || !['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status parameter' }, { status: 400 });
    }

    const updated = await updateVoterRequestStatus(id, {
      status,
      rejection_reason,
      reviewed_by: reviewed_by || 'Admin Operator',
    });

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Error updating request status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update request status' },
      { status: 500 }
    );
  }
}
