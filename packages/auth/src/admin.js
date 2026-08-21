import { requireAuth } from './middleware.js';

/**
 * Admin gate for the /admin monitoring surface.
 *
 * Membership is an ENV ALLOWLIST, not a role: NEWTON_ADMIN_EMAILS is a
 * comma-separated list of emails. Deliberately not a new `admin` role on the
 * User model — that would be tutoring-adjacent schema for what is currently
 * one operator, and an env var can be changed without a migration.
 *
 * NEWTON_ADMIN_EMAILS must be declared in turbo.json's build `env` array.
 * Turborepo strips undeclared vars, which has already cost one failed-build
 * debugging session on this repo.
 */
export function adminEmails() {
  return (process.env.NEWTON_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const list = adminEmails();
  // Empty allowlist denies everyone. Failing closed matters here: a missing
  // or stripped env var must never silently open the dashboard up.
  if (list.length === 0) return false;
  return list.includes(String(email).trim().toLowerCase());
}

/**
 * Verify the JWT, then check the allowlist. Throws the same way requireAuth
 * does so callers can treat it as one gate.
 *
 * @param {Request} request
 * @param {(id: string) => Promise<{ email?: string } | null>} loadUser
 *   Fetches the user record — injected so this package keeps no dependency on
 *   packages/database (the monorepo boundary rules forbid it).
 * @returns {Promise<{ id: string, email: string }>}
 */
export async function requireAdmin(request, loadUser) {
  const payload = await requireAuth(request);
  const user = await loadUser(payload.sub);
  if (!isAdminEmail(user?.email)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return { id: payload.sub, email: user.email };
}

export default requireAdmin;
