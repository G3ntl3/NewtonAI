// GET /api/chat/session?subject=... — fetches (or starts) the student's one
// chat for this subject, including saved history, so the chat page can
// hydrate right after the subject picker's onSelect. Kept as its own route
// file (not added to api/chat/route.js) since that file is protected.
import { requireStudent } from '@newton/auth/src/session.js';
import { getOrCreateSession } from '@newton/database/src/repositories/sessionRepo.js';
import { SUBJECTS } from '@newton/database/src/models/Session.js';

export const runtime = 'nodejs';

export async function GET(req) {
  let student;
  try {
    student = await requireStudent(req);
  } catch {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const subject = new URL(req.url).searchParams.get('subject');
  if (!Object.values(SUBJECTS).includes(subject)) {
    return Response.json({ ok: false, error: 'Invalid or missing subject' }, { status: 400 });
  }

  const session = await getOrCreateSession(student.id, subject);
  if (!session) {
    return Response.json({ ok: false, error: 'Could not start session' }, { status: 500 });
  }

  return Response.json({
    ok: true,
    data: {
      subject: session.subject,
      concept: session.concept,
      revealLevel: session.revealLevel,
      history: session.history,
    },
  });
}
