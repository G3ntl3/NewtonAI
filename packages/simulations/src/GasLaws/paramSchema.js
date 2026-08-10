import { z } from 'zod';

/**
 * GasLaws paramSchema
 * Validates the params the AI may pass to the GasLaws simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 *
 * ONE simulation with a MODE selector, not a free three-variable surface:
 * `mode` names the variable held CONSTANT, which in turn selects the law
 * being explored (constant T -> Boyle, constant P -> Charles, constant V ->
 * Gay-Lussac). Every bound below is strictly positive, so none of the
 * ratios in those laws can divide by zero.
 */
export const paramSchema = z.object({
  /** Which variable is held constant — selects the law. */
  mode: z
    .enum(['constant-temperature', 'constant-pressure', 'constant-volume'])
    .default('constant-temperature'),
  /** Pressure in atmospheres. */
  pressure: z.number().min(0.5).max(10).default(2),
  /** Volume in litres. */
  volume: z.number().min(1).max(20).default(5),
  /** Absolute temperature in Kelvin — min well above 0 K, so V/T and P/T are always finite. */
  temperature: z.number().min(200).max(500).default(300),
});

export default paramSchema;
