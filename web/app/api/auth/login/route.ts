import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/auth/roles';
import { signSessionSync } from '@/lib/auth/sessionCrypto';

// Authorized accounts per production security configuration
// Roles: 'admin' | 'supervisor' | 'operator' | 'field_agent'
const AUTHORIZED_ACCOUNTS: Record<
  string,
  { email: string; role: UserRole; password: string }
> = {
  amulya: {
    email: 'amulya@electorportal.com',
    role: 'admin',
    password: '1234@admin@',
  },
  admin: {
    email: 'amulya@electorportal.com',
    role: 'admin',
    password: '1234@admin@',
  },
  operator: {
    email: 'operator@electorportal.com',
    role: 'operator',
    password: '1234@guest@',
  },
  worker: {
    email: 'worker@electorportal.com',
    role: 'field_agent',
    password: '1234@worker@',
  },
  supervisor: {
    email: 'supervisor@electorportal.com',
    role: 'supervisor',
    password: '1234@supervisor',
  },
};

// Rate limiting & Brute-force protection configurations
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes (120 seconds)
const ATTEMPTS_WINDOW_MS = 10 * 60 * 1000; // 10 minutes reset window

interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

// In-memory rate limiting store keyed by client IP
const loginRateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const record = loginRateLimitStore.get(clientIp);
  const now = Date.now();

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json({
      isLocked: true,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
      attemptsLeft: 0,
    });
  }

  const attemptsLeft = record
    ? Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts)
    : MAX_FAILED_ATTEMPTS;

  return NextResponse.json({
    isLocked: false,
    attemptsLeft,
  });
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const now = Date.now();

    // Development/Test reset hook
    if (request.headers.get('x-test-reset-ratelimit') === 'true') {
      loginRateLimitStore.delete(clientIp);
      return NextResponse.json({ reset: true });
    }

    // 1. Check existing lockout
    const record = loginRateLimitStore.get(clientIp);
    if (record && record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: 'Too many failed attempts (5/5). Account temporarily locked for 2 minutes. Please try again after 2 minutes.',
          lockedUntil: record.lockedUntil,
          retryAfterSeconds,
          attemptsLeft: 0,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    // If existing lockout has expired, reset counter
    if (record && record.lockedUntil && record.lockedUntil <= now) {
      record.lockedUntil = null;
      record.failedAttempts = 0;
    }

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

    // Strict authentication: exact assigned password check only
    const isPasswordValid = account && account.password === password;

    if (!account || !isPasswordValid) {
      // Record failed attempt
      const currentRecord: RateLimitEntry = record || {
        failedAttempts: 0,
        lockedUntil: null,
        lastAttemptAt: now,
      };

      // Reset failed attempts if last attempt was older than sliding window
      if (now - currentRecord.lastAttemptAt > ATTEMPTS_WINDOW_MS) {
        currentRecord.failedAttempts = 0;
      }

      currentRecord.failedAttempts += 1;
      currentRecord.lastAttemptAt = now;

      if (currentRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_DURATION_MS;
        currentRecord.lockedUntil = lockedUntil;
        loginRateLimitStore.set(clientIp, currentRecord);

        const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000); // 120s
        return NextResponse.json(
          {
            error: 'Too many failed attempts (5/5). Account temporarily locked for 2 minutes. Please try again after 2 minutes.',
            lockedUntil,
            retryAfterSeconds,
            attemptsLeft: 0,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSeconds),
            },
          }
        );
      } else {
        loginRateLimitStore.set(clientIp, currentRecord);
        const attemptsLeft = MAX_FAILED_ATTEMPTS - currentRecord.failedAttempts;
        return NextResponse.json(
          {
            error: `Invalid username or password. ${attemptsLeft} attempt${
              attemptsLeft === 1 ? '' : 's'
            } remaining before a 2-minute lockout.`,
            attemptsLeft,
          },
          { status: 401 }
        );
      }
    }

    // 2. Successful authentication: Clear failed attempts for this client
    loginRateLimitStore.delete(clientIp);

    // Generate cryptographically signed session payload
    const sessionData = {
      userId: `user_${key}`,
      username: key,
      email: account.email,
      role: account.role,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const sessionString = signSessionSync(sessionData);

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
