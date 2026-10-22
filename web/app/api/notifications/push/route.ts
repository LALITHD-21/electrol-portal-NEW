import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastPushNotification,
  getAllSubscriptions,
  SCHEDULED_REMINDERS,
  SendPushPayload,
} from '@/lib/push-service';
import { requireRole, isAuthError, isInternalAdminAuthorized } from '@/lib/auth/roles';

function isAuthorized(request: NextRequest): boolean {
  // 1. Check direct admin push secret header
  const authHeader = request.headers.get('x-admin-push-secret');
  const configuredSecret = process.env.ADMIN_PUSH_SECRET || 'shashi_mlc_2026_push_secret';
  if (authHeader && authHeader === configuredSecret) {
    return true;
  }

  // 2. Check internal admin token or session role
  if (isInternalAdminAuthorized(request)) return true;

  const auth = requireRole(request, 'admin', 'supervisor');
  return !isAuthError(auth);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  const subscribers = await getAllSubscriptions();
  const enCount = subscribers.filter((s) => s.language === 'en').length;
  const knCount = subscribers.filter((s) => s.language === 'kn').length;

  return NextResponse.json({
    subscribersCount: subscribers.length,
    languages: {
      en: enCount,
      kn: knCount,
    },
    scheduledReminders: SCHEDULED_REMINDERS,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, body: messageBody, url, tag, language, templateId } = body;

    let payload: SendPushPayload;

    if (templateId) {
      const template = SCHEDULED_REMINDERS.find((t) => t.id === templateId);
      if (!template) {
        return NextResponse.json({ error: `Template '${templateId}' not found.` }, { status: 400 });
      }
      payload = {
        title: template.title,
        body: template.body,
        url: template.url,
        tag: template.tag,
        language: language || 'all',
      };
    } else {
      if (!title || !messageBody) {
        return NextResponse.json(
          { error: 'Both title and body are required to send a push notification.' },
          { status: 400 }
        );
      }
      payload = {
        title,
        body: messageBody,
        url: url || '/search',
        tag: tag || 'campaign-announcement',
        language: language || 'all',
      };
    }

    const result = await broadcastPushNotification(payload);

    return NextResponse.json({
      success: true,
      message: `Delivered push notification to ${result.sent} subscribers.`,
      result,
    });
  } catch (err: any) {
    console.error('Push broadcast error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch push notifications.' },
      { status: 500 }
    );
  }
}
