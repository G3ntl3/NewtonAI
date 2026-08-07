import { z } from 'zod';

/**
 * QuadraticExplorer paramSchema
 * Validates the params the AI may pass to the QuadraticExplorer simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 * Quadratic only: y = ax^2 + bx + c. `a` is clamped away from 0 (not
 * rejected) so it can never collapse to a straight line — an AI-chosen
 * a=0 still renders a (near-flat) parabola instead of hitting
 * SimulationBlock's fallback.
 */
const MIN_A_MAGNITUDE = 0.1;

export const paramSchema = z.object({
  /** Quadratic coefficient. */
  a: z
    .number()
    .min(-5)
    .max(5)
    .default(1)
    .transform((v) => (Math.abs(v) < MIN_A_MAGNITUDE ? (v < 0 ? -MIN_A_MAGNITUDE : MIN_A_MAGNITUDE) : v)),
  /** Linear coefficient. */
  b: z.number().min(-10).max(10).default(0),
  /** Constant term. */
  c: z.number().min(-10).max(10).default(0),
});

export default paramSchema;
