import { requireAuth } from '@newton/auth';
import { getDashboardSummary } from '@newton/analytics';

/**
 * dashboard summary route handler
 * GET /api/dashboard/summary — composes the logged-in student's dashboard payload.
 *
 * Rule: this file must stay thin. Parse request, call a Controller,
 * return a Response. Business logic belongs in a Service, not here.
 */

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request) {
  let payload;
  try {
    payload = await requireAuth(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    const summary = await getDashboardSummary(payload.sub);
    return jsonResponse({ ok: true, data: summary });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not load dashboard' }, 500);
  }
}
