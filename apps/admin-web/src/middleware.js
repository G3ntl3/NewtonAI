import { NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/recovery', '/forgot-password', '/api/auth'];

function isPublicPath(pathname) {
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Edge-safe gate only. JWT cryptographic verification happens in Node route handlers
 * via `requireAuth` — jsonwebtoken / dotenv are not Edge-compatible.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
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

  if (!hasBearer && !hasCookie) {
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
