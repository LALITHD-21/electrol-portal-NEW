import { NextRequest, NextResponse } from 'next/server';
import { trackVoterRequest } from '@/lib/requestsService';

// In-memory rate limiting map: ip -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          found: false,
          error: 'Rate limit exceeded. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { referenceId, epic, mobile, query } = body;

    // Call dual-mode track function (Reference ID or EPIC Number)
    const result = await trackVoterRequest({ referenceId, epic, mobile, query });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Public track endpoint error:', error);
    return NextResponse.json(
      {
        found: false,
        message: 'No request found matching the provided Reference ID or EPIC Number.',
      },
      { status: 200 } // Constant status response
    );
  }
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        found: false,
        error: 'Rate limit exceeded. Please wait a few minutes before trying again.',
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const referenceId = searchParams.get('ref') || searchParams.get('referenceId') || undefined;
  const epic = searchParams.get('epic') || undefined;
  const query = searchParams.get('q') || searchParams.get('query') || undefined;
  const mobile = searchParams.get('mobile') || undefined;

  const result = await trackVoterRequest({ referenceId, epic, mobile, query });
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
