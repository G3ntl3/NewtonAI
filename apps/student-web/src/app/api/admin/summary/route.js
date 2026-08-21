// GET /api/admin/summary?range=today|7d|30d|all
//
// Thin route (blueprint §4.4): gate, delegate to the aggregator, return JSON.
// All aggregation happens in MongoDB inside getAdminSummary.

import { requireAdmin } from '@newton/auth/src/admin.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import { getAdminSummary } from '@newton/analytics/src/aggregators/adminSummary.js';

export const runtime = 'nodejs'; // Mongoose needs Node, not Edge

const RANGES = ['today', '7d', '30d', 'all'];

export async function GET(request) {
  try {
    // loadUser is injected so packages/auth stays free of any database
    // dependency (monorepo boundary rules).
    await requireAdmin(request, (id) => UserRepository.findById(id));
  } catch (err) {
    const status = err.status === 403 ? 403 : 401;
    return Response.json(
      { ok: false, error: status === 403 ? 'Forbidden' : 'Unauthorized' },
      { status }
    );
  }

  const requested = new URL(request.url).searchParams.get('range') ?? '7d';
  const range = RANGES.includes(requested) ? requested : '7d';

  try {
    const data = await getAdminSummary({ range });
    return Response.json({ ok: true, data });
  } catch (err) {
    console.error('[GET /api/admin/summary] failed:', err.message);
    return Response.json({ ok: false, error: 'Failed to build summary' }, { status: 500 });
  }
}
