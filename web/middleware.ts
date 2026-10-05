import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const PROTECTED_ROUTES = [
      '/dashboard',
      '/profile',
      '/search',
      '/directory',
      '/analytics',
      '/field',
      '/admin',
    ];
    const AUTH_ROUTES = ['/login'];

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    // 1. Check HTTP-Only session cookie
    let isAuthenticated = false;
    const sessionCookie = request.cookies.get('elector_auth_session')?.value;

    if (sessionCookie) {
      try {
        const jsonStr = atob(sessionCookie);
        const decoded = JSON.parse(jsonStr);
        if (decoded && decoded.expiresAt && decoded.expiresAt > Date.now()) {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    // 2. Not authenticated + trying to access a protected route → redirect to /login
    if (!isAuthenticated && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 3. Authenticated + trying to access /login → redirect to /search
    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL('/search', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware execution error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/profile/:path*',
    '/search/:path*',
    '/directory/:path*',
    '/analytics/:path*',
    '/field/:path*',
    '/admin/:path*',
  ],
};
