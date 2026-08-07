import { recoveryHandler } from '@newton/auth';

/**
 * POST /api/auth/recovery
 * Body: { "email": "...", "code": "XXXX-XXXX-XXXX", "newPassword": "..." }
 */
export async function POST(request) {
  return recoveryHandler(request);
}
