import { NextRequest, NextResponse } from 'next/server';
import { removeSubscription } from '@/lib/push-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'Valid subscription endpoint is required to unsubscribe.' },
        { status: 400 }
      );
    }

    const removed = await removeSubscription(endpoint);

    return NextResponse.json({
      success: true,
      removed,
      message: removed
        ? 'Unsubscribed successfully.'
        : 'Endpoint not found or already unsubscribed.',
    });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to remove subscription.' },
      { status: 500 }
    );
  }
}
