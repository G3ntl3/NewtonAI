import { env } from '@newton/config/src/env.js';

export const ACCESS_COOKIE_NAME = 'newton_access_token';
export const REFRESH_COOKIE_NAME = 'newton_refresh_token';

// Cookie lifetimes MUST track the JWTs' own expiry (env.NEWTON_JWT_*_EXPIRES,
// used by signToken.js) — otherwise the browser deletes the cookie before the
// token itself expires, logging the student out earlier than intended.
function parseExpiresToSeconds(value, fallbackSeconds) {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(String(value || '').trim());
  if (!match) return fallbackSeconds;
  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 60 * 60, d: 60 * 60 * 24 }[match[2].toLowerCase()];
  return amount * multiplier;
}

const ACCESS_EXPIRES_SECONDS = parseExpiresToSeconds(env.NEWTON_JWT_ACCESS_EXPIRES, 60 * 15);
const REFRESH_EXPIRES_SECONDS = parseExpiresToSeconds(env.NEWTON_JWT_REFRESH_EXPIRES, 60 * 60 * 24 * 7);

function buildCookie(name, value, maxAge, domain) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (domain) {
    parts.push(`Domain=${domain}`);
  }

  if (env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function readCookie(request, name) {
  if (request.cookies?.get) {
    const value = request.cookies.get(name)?.value;
    return value ? decodeURIComponent(value) : null;
  }

  const header = request.headers?.get?.('cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAccessTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return readCookie(request, ACCESS_COOKIE_NAME);
}

export function getRefreshTokenFromRequest(request, bodyToken) {
  if (bodyToken) {
    return String(bodyToken).trim();
  }

  const authHeader = request.headers.get('x-refresh-token');
  if (authHeader) {
    return authHeader.trim();
  }

  return readCookie(request, REFRESH_COOKIE_NAME);
}

export function buildAuthSetCookieHeaders(accessToken, refreshToken, options = {}) {
  const headers = new Headers();
  const domain = options.domain || env.NEWTON_AUTH_COOKIE_DOMAIN;

  headers.append('Set-Cookie', buildCookie(ACCESS_COOKIE_NAME, accessToken, ACCESS_EXPIRES_SECONDS, domain));
  headers.append('Set-Cookie', buildCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_EXPIRES_SECONDS, domain));

  return headers;
}

export function clearAuthSetCookieHeaders(options = {}) {
  const headers = new Headers();
  const domain = options.domain || env.NEWTON_AUTH_COOKIE_DOMAIN;

  headers.append('Set-Cookie', buildCookie(ACCESS_COOKIE_NAME, '', 0, domain));
  headers.append('Set-Cookie', buildCookie(REFRESH_COOKIE_NAME, '', 0, domain));

  return headers;
}

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    role: user.role,
    fullName: user.fullName || user.name || undefined,
    name: user.fullName || user.name || undefined,
    schoolName: user.schoolName || null,
    schoolId: user.schoolId ? user.schoolId.toString() : null,
  };
}
