/**
 * Role-Based Access Control for the Elector Lookup Portal.
 *
 * Architecture:
 * - Reads the existing `elector_auth_session` base64 cookie
 * - Returns a typed `AuthSession` with `role: UserRole`
 * - `requireRole(...roles)` is the server-side guard for API routes
 *   and Server Components
 *
 * Migration path to Supabase Auth JWT:
 * - Replace the body of `getSessionFromCookie()` to decode a JWT
 *   from Supabase Auth instead of the base64 cookie
 * - Everything else stays the same
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// ─── Types ──────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator' | 'field_agent';

export interface AuthSession {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  expiresAt: number;
}

export interface AuthResult {
  session: AuthSession;
}

export interface AuthError {
  error: string;
  status: 401 | 403;
}

// ─── Role Hierarchy ─────────────────────────────────────────

/**
 * Maps user-facing role labels (from the login route) to canonical
 * UserRole values. This is the single source of truth for role naming.
 */
const ROLE_LABEL_MAP: Record<string, UserRole> = {
  'system admin': 'admin',
  'admin': 'admin',
  'data operator': 'operator',
  'operator': 'operator',
  'field agent': 'field_agent',
  'field_agent': 'field_agent',
};

/**
 * Normalize a role string from the cookie to a canonical UserRole.
 * Returns null if the role is not recognized.
 */
function normalizeRole(raw: string): UserRole | null {
  const key = raw.trim().toLowerCase();
  return ROLE_LABEL_MAP[key] ?? null;
}

// ─── Session Extraction ─────────────────────────────────────

/**
 * Extract the authenticated session from the request cookie.
 *
 * Returns `AuthSession` if valid, `null` if missing or expired.
 *
 * This is the ONE function to change when migrating to Supabase Auth JWT.
 */
export function getSessionFromCookie(
  cookieSource?: NextRequest
): AuthSession | null {
  try {
    let cookieValue: string | undefined;

    if (cookieSource) {
      // 1. Try NextRequest cookie API
      cookieValue = cookieSource.cookies.get('elector_auth_session')?.value;

      // 2. Fallback to raw Cookie header if available
      if (!cookieValue) {
        const rawCookie = cookieSource.headers.get('cookie') || '';
        const match = rawCookie.match(/elector_auth_session=([^;]+)/);
        if (match) cookieValue = match[1];
      }
    }

    // 3. Fallback to next/headers cookies()
    if (!cookieValue) {
      try {
        const cookieStore = cookies();
        cookieValue = cookieStore.get('elector_auth_session')?.value;
      } catch {
        // Handled outside Server Component context
      }
    }

    if (!cookieValue) return null;

    // Decode base64 using Buffer for full Node/Edge compatibility
    const cleanCookie = decodeURIComponent(cookieValue);
    const jsonStr = typeof Buffer !== 'undefined'
      ? Buffer.from(cleanCookie, 'base64').toString('utf-8')
      : atob(cleanCookie);

    const decoded = JSON.parse(jsonStr) as Record<string, unknown>;

    if (
      !decoded ||
      typeof decoded.expiresAt !== 'number' ||
      decoded.expiresAt <= Date.now()
    ) {
      return null;
    }

    const rawRole = String(decoded.role ?? '');
    const role = normalizeRole(rawRole);

    if (!role) return null;

    return {
      userId: String(decoded.userId ?? ''),
      username: String(decoded.username ?? ''),
      email: String(decoded.email ?? ''),
      role,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

// ─── requireRole() — Server-Side Guard ──────────────────────

/**
 * Server-side role check. Call at the top of any API route handler
 * or Server Component that needs access control.
 *
 * Usage in API routes:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = requireRole(request, 'admin', 'operator');
 *   if ('error' in auth) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   const { session } = auth;
 *   // ... proceed with session.role, session.username, etc.
 * }
 * ```
 *
 * Usage in Server Components (no request object):
 * ```ts
 * const auth = requireRole(null, 'admin', 'operator');
 * if ('error' in auth) { redirect('/login'); }
 * ```
 */
export function requireRole(
  request: NextRequest | null,
  ...allowedRoles: UserRole[]
): AuthResult | AuthError {
  const session = request
    ? getSessionFromCookie(request)
    : getSessionFromCookie();

  if (!session) {
    return {
      error: 'Authentication required. Please log in.',
      status: 401,
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${session.role}.`,
      status: 403,
    };
  }

  return { session };
}

// ─── Utility Helpers ────────────────────────────────────────

/**
 * Check if a role has at least the given access level.
 * admin > operator > field_agent
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    admin: 3,
    operator: 2,
    field_agent: 1,
  };
  return hierarchy[userRole] >= hierarchy[minRole];
}

/**
 * Mask a mobile number for field_agent display.
 * e.g., "9876543210" → "98XXXXX210"
 * Returns the full number for admin/operator.
 */
export function maskMobile(
  mobile: string | null,
  role: UserRole
): string | null {
  if (!mobile) return null;

  const digits = mobile.replace(/\D/g, '');
  if (digits.length !== 10) return mobile;

  if (role === 'field_agent') {
    return `${digits.slice(0, 2)}XXXXX${digits.slice(7)}`;
  }

  return digits;
}

/**
 * Type guard to check if an auth result is an error.
 */
export function isAuthError(
  result: AuthResult | AuthError
): result is AuthError {
  return 'error' in result;
}
