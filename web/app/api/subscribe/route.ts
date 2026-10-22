import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription } from '@/lib/push-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, language } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid PushSubscription: endpoint is required.' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown Browser';
    const lang = language === 'kn' ? 'kn' : 'en';

    const record = await saveSubscription(subscription, lang, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Subscribed to polling day notifications successfully.',
      id: record.id,
      language: record.language,
    });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to register subscription.' },
      { status: 500 }
    );
  }
}
