import { z } from 'zod';

/**
 * ProjectileMotion paramSchema
 * Validates the params the AI may pass to the ProjectileMotion simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 */
export const paramSchema = z.object({
  /** Launch angle above the horizontal, in degrees. */
  angle: z.number().min(0).max(90).default(45),
  /** Launch speed, in m/s. */
  speed: z.number().min(0).max(50).default(20),
});

export default paramSchema;
