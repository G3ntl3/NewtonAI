import { signupHandler } from '@newton/auth';

/**
 * POST /api/auth/signup
 * Body: { "name", "email", "password", "role"? }
 */
export async function POST(request) {
  return signupHandler(request);
}
