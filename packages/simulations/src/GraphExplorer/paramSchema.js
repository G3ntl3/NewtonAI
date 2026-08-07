import { z } from 'zod';

/**
 * GraphExplorer paramSchema
 * Validates the params the AI may pass to the GraphExplorer simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 * Linear only: y = mx + c.
 */
export const paramSchema = z.object({
  /** Slope. */
  m: z.number().min(-10).max(10).default(1),
  /** Y-intercept. */
  c: z.number().min(-10).max(10).default(0),
});

export default paramSchema;
