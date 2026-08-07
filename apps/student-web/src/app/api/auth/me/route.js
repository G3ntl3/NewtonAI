import { meHandler } from '@newton/auth';

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <accessToken>
 */
export async function GET(request) {
  return meHandler(request);
}
