import { requireRole } from './middleware.js';
import { ROLES } from './rbac/roles.js';

/**
 * Verify the access JWT and require the STUDENT role. Throws (401/403,
 * matching requireAuth/requireRole) if the token is missing, invalid, or
 * belongs to a non-student.
 * @returns {Promise<{ id: string, role: string }>}
 */
export async function requireStudent(req) {
  const payload = await requireRole(req, [ROLES.STUDENT]);
  return { id: payload.sub, role: payload.role };
}
