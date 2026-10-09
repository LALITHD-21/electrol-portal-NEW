import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionEdge } from '@/lib/auth/sessionCrypto';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const PROTECTED_ROUTES = [
      '/dashboard',
      '/directory',
      '/analytics',
      '/field',
      '/admin',
    ];
    const AUTH_ROUTES = ['/login', '/team'];

    const isProtectedRoute = PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const isAuthRoute = AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // 1. Check HTTP-Only session cookie with HMAC signature verification
    let isAuthenticated = false;
    const sessionCookie = request.cookies.get('elector_auth_session')?.value;

    if (sessionCookie) {
      const decoded = await verifySessionEdge(sessionCookie);
      if (decoded && decoded.expiresAt && (decoded.expiresAt as number) > Date.now()) {
        isAuthenticated = true;
      }
    }

    // 2. Not authenticated + trying to access a protected route → redirect to /team login
    if (!isAuthenticated && isProtectedRoute) {
      const redirectUrl = new URL('/team', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 3. Authenticated + trying to access auth pages → redirect to /admin/requests
    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL('/admin/requests', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  } catch (error) {
    console.error('Middleware execution error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/analytics',
    '/analytics/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/directory',
    '/directory/:path*',
    '/field',
    '/field/:path*',
    '/login',
    '/team',
  ],
};
