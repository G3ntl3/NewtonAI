import { z } from 'zod';
import { KA_MIN, KA_MAX } from './chemistry.js';

/**
 * Titration paramSchema
 * Validates the params the AI may pass to the Titration simulation
 * (blueprint §4.3 — the per-sim validation layer, beyond the generic
 * z.record(z.unknown()) shape check in packages/types/src/conversation.js).
 *
 * The chemistry itself lives in ./chemistry.js and is verified separately.
 */
export const paramSchema = z.object({
  /** Analyte in the flask, mol/L. */
  acidConcentration: z.number().min(0.001).max(5).default(0.1),
  /** Volume of analyte pipetted into the flask, mL. */
  acidVolumeMl: z.number().min(1).max(100).default(25),
  /** Titrant in the burette, mol/L. */
  baseConcentration: z.number().min(0.001).max(5).default(0.1),
  /**
   * Acid dissociation constant. OMITTED / null => STRONG acid (fully
   * dissociated, equivalence at pH 7). Provide a value only for a weak acid.
   * Bounded to the realistic window from chemistry.js: below KA_MIN an acid
   * is weaker than water, above KA_MAX it behaves as effectively strong and
   * the buffer region collapses — either extreme would draw a chemically
   * nonsensical curve, so out-of-range values are rejected here rather than
   * silently producing a wrong lesson.
   */
  ka: z.number().min(KA_MIN).max(KA_MAX).nullable().optional().default(null),
  /**
   * pH at which the indicator is treated as having changed colour. 8.2 is
   * phenolphthalein, the usual school choice for acid-into-base titrations.
   * Generic endpoint flag only — not real indicator colour chemistry.
   */
  endpointPh: z.number().min(3).max(11).default(8.2),
});

export default paramSchema;
