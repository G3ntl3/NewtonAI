import { z } from 'zod';

/**
 * OhmsLaw paramSchema
 * Validates the params the AI may pass to the OhmsLaw simulation (blueprint
 * §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 * Single series circuit only: I = V / R. `resistance` is clamped away from
 * 0 (not rejected) so it can never divide by zero — an AI-chosen R=0 still
 * renders (as a very small resistance) instead of hitting SimulationBlock's
 * fallback. Current is DERIVED, not a param — the AI never sets it.
 */
const MIN_RESISTANCE = 0.5;

export const paramSchema = z.object({
  /** Source EMF, volts. */
  voltage: z.number().min(1).max(24).default(12),
  /** Circuit resistance, ohms. */
  resistance: z
    .number()
    .min(0)
    .max(50)
    .default(6)
    .transform((v) => Math.max(v, MIN_RESISTANCE)),
});

export default paramSchema;
