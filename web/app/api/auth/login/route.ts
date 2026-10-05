import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/auth/roles';

// Preset authorized accounts
// Roles MUST match canonical UserRole values: 'admin' | 'operator' | 'field_agent'
const AUTHORIZED_ACCOUNTS: Record<string, { email: string; role: UserRole; password: string }> = {
  admin: {
    email: 'admin@electorportal.com',
    role: 'admin',
    password: '1234@portal',
  },
  operator: {
    email: 'operator@electorportal.com',
    role: 'operator',
    password: '1234@admin',
  },
  field: {
    email: 'field@electorportal.com',
    role: 'field_agent',
    password: '1234@field',
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body || {};

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please enter both username and password.' },
        { status: 400 }
      );
    }

    const key = identifier.trim().toLowerCase().replace('@electorportal.com', '');
    const account = AUTHORIZED_ACCOUNTS[key];

    if (!account || account.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password. Please try again.' },
        { status: 401 }
      );
    }

    // Generate secure session payload
    const sessionData = {
      userId: `user_${key}`,
      username: key,
      email: account.email,
      role: account.role,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const sessionString = btoa(JSON.stringify(sessionData));

    const response = NextResponse.json({
      success: true,
      user: {
        email: account.email,
        username: key,
        role: account.role,
      },
    });

    // Set secure HTTP-Only auth session cookie
    response.cookies.set('elector_auth_session', sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication error occurred.' },
      { status: 500 }
    );
  }
}
