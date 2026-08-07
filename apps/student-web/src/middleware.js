import { NextResponse } from 'next/server';

// Auth-only pages: accessible while logged out, but an already-authenticated
// visitor gets bounced to /dashboard instead of re-entering login/signup/reset.
const AUTH_PAGE_PREFIXES = ['/login', '/signup', '/reset-password', '/recovery', '/forgot-password'];

// Always public, regardless of auth state — the login/signup/logout/me calls
// themselves must keep working even for an already-authenticated user.
const ALWAYS_PUBLIC_PREFIXES = ['/api/auth'];

function matchesPrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Edge-safe gate only. JWT cryptographic verification happens in Node route handlers
 * via `requireAuth` — jsonwebtoken / dotenv are not Edge-compatible.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, ALWAYS_PUBLIC_PREFIXES)) {
    return NextResponse.next();
  }

  // API routes (other than /api/auth): leave auth to handlers so Postman gets JSON 401s.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const hasBearer = Boolean(
    (request.headers.get('authorization') || '').match(/^Bearer\s+\S+/i)
  );
  const hasCookie = Boolean(request.cookies.get('newton_access_token')?.value);
  const isAuthenticated = hasBearer || hasCookie;

  if (matchesPrefix(pathname, AUTH_PAGE_PREFIXES)) {
    if (isAuthenticated) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      dashboardUrl.search = '';
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
