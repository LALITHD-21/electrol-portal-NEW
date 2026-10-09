import { NextRequest, NextResponse } from 'next/server';
import { dispatchPendingNotifications, getNotificationsList } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const result = await dispatchPendingNotifications();
    return NextResponse.json({
      success: true,
      message: `Dispatched ${result.sent} pending notifications.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Notification dispatch error:', error);
    return NextResponse.json(
      { error: error.message || 'Notification dispatch failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const list = await getNotificationsList();
    const queuedCount = list.filter((n) => n.status === 'queued').length;
    const sentCount = list.filter((n) => n.status === 'sent').length;

    return NextResponse.json({
      notifications: list.slice(-50).reverse(),
      stats: {
        total: list.length,
        queued: queuedCount,
        sent: sentCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
