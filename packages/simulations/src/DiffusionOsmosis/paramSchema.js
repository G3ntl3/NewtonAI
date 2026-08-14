import { z } from 'zod';

/**
 * DiffusionOsmosis paramSchema
 * Validates the params the AI may pass to the DiffusionOsmosis simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 *
 * ONE simulation, TWO modes, same underlying particle model:
 *   diffusion — open container, particles spread down the gradient.
 *   osmosis   — a membrane splits the container; only water crosses.
 *
 * Bounds are chosen so the visual can never break: at least 10 particles so
 * a gradient is legible, at most 80 so the container never turns into an
 * unreadable smear, and a 0..1 concentration difference so the split maths
 * can never put particles outside the container.
 */
export const paramSchema = z.object({
  mode: z.enum(['diffusion', 'osmosis']).default('diffusion'),
  /** How many particles to render (solute + water combined in osmosis mode). */
  particleCount: z.number().int().min(10).max(80).default(30),
  /** 0 = already evenly mixed, 1 = maximally lopsided ("a drop of ink"). */
  initialConcentrationDifference: z.number().min(0).max(1).default(0.8),
});

export default paramSchema;
