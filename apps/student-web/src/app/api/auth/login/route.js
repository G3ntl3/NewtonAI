import { loginHandler } from '@newton/auth';

/**
 * POST /api/auth/login
 * Body: { "fullName": "Demo Ada Student", "password": "Password123!" }
 */
export async function POST(request) {
  return loginHandler(request);
}
