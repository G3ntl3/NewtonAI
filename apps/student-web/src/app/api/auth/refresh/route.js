import { refreshHandler } from '@newton/auth';

/**
 * POST /api/auth/refresh
 * Body: { "refreshToken": "..." }  (optional if cookie / X-Refresh-Token is set)
 */
export async function POST(request) {
  return refreshHandler(request);
}
