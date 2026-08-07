import { resetPasswordHandler } from '@newton/auth';

/**
 * POST /api/auth/reset-password
 * Body: { "code": "XXXX-XXXX-XXXX-XXXX", "newPassword": "..." }
 * Students only.
 */
export async function POST(request) {
  return resetPasswordHandler(request);
}
