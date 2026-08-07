// GET /api/chat/resume — the student's most recently active chat session
// (any subject, concept already established), for the chat landing
// screen's "Continue where you stopped" card. Kept as its own route file
// (not added to api/chat/route.js) since that file is protected.
import { requireStudent } from '@newton/auth/src/session.js';
import { findMostRecentActiveForUser } from '@newton/database/src/repositories/sessionRepo.js';

export const runtime = 'nodejs';

export async function GET(req) {
  let student;
  try {
    student = await requireStudent(req);
  } catch {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const session = await findMostRecentActiveForUser(student.id);

  return Response.json({
    ok: true,
    data: session
      ? {
          subject: session.subject,
          concept: session.concept,
          revealLevel: session.revealLevel,
          updatedAt: session.updatedAt,
        }
      : null,
  });
}
