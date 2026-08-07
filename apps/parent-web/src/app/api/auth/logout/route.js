import { logoutHandler } from '@newton/auth';

/**
 * POST /api/auth/logout
 */
export async function POST() {
  return logoutHandler();
}
