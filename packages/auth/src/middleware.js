import { getAccessTokenFromRequest } from './session/session.js';
import { verifyAccessToken } from './jwt/verifyToken.js';
import { hasRole } from './rbac/roles.js';

/**
 * Verify JWT from Authorization Bearer header or access cookie.
 * @returns {Promise<object>} JWT payload
 */
export async function requireAuth(request) {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }

  try {
    return verifyAccessToken(token);
  } catch {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }
}

/**
 * Require auth and one of the allowed roles.
 */
export async function requireRole(request, allowedRoles = []) {
  const payload = await requireAuth(request);
  if (!hasRole(payload.role, allowedRoles)) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }
  return payload;
}

export default requireAuth;
