import { NextRequest, NextResponse } from 'next/server';
import { verifySessionSync } from '@/lib/auth/sessionCrypto';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('elector_auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          authenticated: false,
          role: null,
          username: null,
        },
        { status: 401 }
      );
    }

    const decoded = verifySessionSync(sessionCookie);
    if (!decoded) {
      return NextResponse.json(
        {
          authenticated: false,
          role: null,
          username: null,
        },
        { status: 401 }
      );
    }

    const rawRole = (decoded.role as string) || 'admin';
    // Normalize role to 'admin' | 'supervisor' | 'operator'
    let normalizedRole: 'admin' | 'supervisor' | 'operator' = 'admin';
    if (rawRole.includes('supervisor')) normalizedRole = 'supervisor';
    else if (rawRole.includes('operator')) normalizedRole = 'operator';
    else normalizedRole = 'admin';

    return NextResponse.json({
      authenticated: true,
      userId: decoded.userId,
      username: decoded.username || 'admin',
      role: normalizedRole,
      email: decoded.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        authenticated: false,
        role: null,
        username: null,
      },
      { status: 401 }
    );
  }
}
