import { z } from 'zod';

/** POST /api/bookmarks body. */
export const bookmarkCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(30).nullable().optional(),
  sourceType: z.enum(['chat', 'lesson', 'flashcard']).default('chat'),
});
