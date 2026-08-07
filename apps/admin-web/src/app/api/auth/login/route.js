import { loginHandler } from '@newton/auth';

/**
 * POST /api/auth/login
 * Body: { "email": "student@newton.ai", "password": "Password123!" }
 */
export async function POST(request) {
  return loginHandler(request);
}
