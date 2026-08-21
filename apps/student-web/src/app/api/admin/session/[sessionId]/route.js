// GET /api/admin/session/:sessionId
//
// Full transcript for one session — what the "stuck at level 0" rows link to,
// so a suspected drift case can be read end to end instead of guessed at.
// Admin-gated exactly like the summary route.

import { requireAdmin } from '@newton/auth/src/admin.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import Session from '@newton/database/src/models/Session.js';
import { connect } from '@newton/database/src/connection.js';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request, (id) => UserRepository.findById(id));
  } catch (err) {
    const status = err.status === 403 ? 403 : 401;
    return Response.json(
      { ok: false, error: status === 403 ? 'Forbidden' : 'Unauthorized' },
      { status }
    );
  }

  const { sessionId } = await params;
  await connect();

  const session = await Session.findOne({ sessionId }).lean().exec();
  if (!session) {
    return Response.json({ ok: false, error: 'Session not found' }, { status: 404 });
  }

  return Response.json({
    ok: true,
    data: {
      sessionId: session.sessionId,
      subject: session.subject,
      concept: session.concept,
      revealLevel: session.revealLevel,
      exchangesAtLevel: session.exchangesAtLevel,
      lastDecisionNote: session.lastDecisionNote,
      updatedAt: session.updatedAt,
      // Per-turn audit trail — assessment, conceptUpdate and decisionNote are
      // already persisted per tutor turn, which is what makes reading a drift
      // case possible without any new schema.
      history: (session.history ?? []).map((t) => ({
        role: t.role,
        text: t.text,
        assessment: t.assessment ?? null,
        conceptUpdate: t.conceptUpdate ?? null,
        decisionNote: t.decisionNote ?? null,
        blockTypes: (t.blocks ?? []).map((b) => b.type),
      })),
    },
  });
}
