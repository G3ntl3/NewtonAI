// GET /api/flashcards  — list the student's own flashcards (ownership
//   enforced by querying with student.id, never a client-supplied userId).
// POST /api/flashcards — create a flashcard (from the chat "+" menu). The
//   client sends a subject SLUG (physics/chemistry/biology/maths), never a
//   subjectId directly — resolved here against the real Subject collection
//   so a student can't attribute a card to an arbitrary subjectId.
import { requireStudent } from '@newton/auth/src/session.js';
import { connect } from '@newton/database/src/connection.js';
import { FlashcardRepository } from '@newton/database/src/repositories/FlashcardRepository.js';
import { SubjectRepository } from '@newton/database/src/repositories/SubjectRepository.js';
import { flashcardCreateSchema } from '@newton/types/src/flashcard.js';

export const runtime = 'nodejs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function toView(flashcard, subjectsBySlug) {
  const subject = flashcard.subjectId
    ? Object.values(subjectsBySlug).find((s) => String(s._id) === String(flashcard.subjectId))
    : null;
  return {
    id: String(flashcard._id),
    question: flashcard.question,
    answer: flashcard.answer,
    seenCount: flashcard.seenCount,
    subject: subject ? { name: subject.name, slug: subject.slug, icon: subject.icon } : null,
    createdAt: flashcard.createdAt,
  };
}

export async function GET(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    await connect();
    const [flashcards, subjects] = await Promise.all([
      FlashcardRepository.findAllForUser(student.id),
      SubjectRepository.listAll(),
    ]);
    const subjectsBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s]));
    return jsonResponse({ ok: true, data: flashcards.map((f) => toView(f, subjectsBySlug)) });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not load flashcards' }, 500);
  }
}

export async function POST(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = flashcardCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  try {
    await connect();
    const subjectDoc = parsed.data.subject
      ? await SubjectRepository.findBySlug(parsed.data.subject)
      : null;

    const flashcard = await FlashcardRepository.create({
      userId: student.id,
      subjectId: subjectDoc?._id ?? null,
      question: parsed.data.question,
      answer: parsed.data.answer,
    });

    return jsonResponse({
      ok: true,
      data: toView(flashcard, subjectDoc ? { [subjectDoc.slug]: subjectDoc } : {}),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not save flashcard' }, 500);
  }
}
