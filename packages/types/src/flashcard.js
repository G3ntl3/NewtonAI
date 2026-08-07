import { z } from 'zod';

/** POST /api/flashcards body — question is the card's front (title), answer the back. */
export const flashcardCreateSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().max(1000).default(''),
  // Subject slug (physics/chemistry/biology/maths) — resolved server-side to
  // a real Subject document's _id; never trust a client-supplied subjectId.
  subject: z.string().trim().min(1).max(30).nullable().optional(),
});
