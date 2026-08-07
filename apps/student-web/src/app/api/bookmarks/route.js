// POST /api/bookmarks — create a bookmark (from the chat "+" menu's
// "Bookmark Chat" action). Listing is already handled by
// packages/analytics/src/aggregators/dashboardSummary.js for the dashboard;
// no GET here yet since nothing else reads a standalone list.
import { requireStudent } from '@newton/auth/src/session.js';
import { connect } from '@newton/database/src/connection.js';
import { BookmarkRepository } from '@newton/database/src/repositories/BookmarkRepository.js';
import { SubjectRepository } from '@newton/database/src/repositories/SubjectRepository.js';
import { bookmarkCreateSchema } from '@newton/types/src/bookmark.js';

export const runtime = 'nodejs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bookmarkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  try {
    await connect();
    const subjectDoc = parsed.data.subject
      ? await SubjectRepository.findBySlug(parsed.data.subject)
      : null;

    const bookmark = await BookmarkRepository.create({
      userId: student.id,
      subjectId: subjectDoc?._id ?? null,
      title: parsed.data.title,
      sourceType: parsed.data.sourceType,
    });

    return jsonResponse({ ok: true, data: { id: String(bookmark._id), title: bookmark.title } });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not save bookmark' }, 500);
  }
}
