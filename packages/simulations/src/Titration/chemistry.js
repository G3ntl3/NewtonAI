/**
 * Acid-base titration chemistry — PURE functions, no React, no UI.
 *
 * Kept in plain .js (not inside the .jsx) so the chemistry can be checked
 * independently under node, which cannot import .jsx. Every number the
 * simulation draws comes from here.
 *
 * ── UNITS ────────────────────────────────────────────────────────────────
 * Concentrations are mol/L (M); volumes are mL. Because
 *   M × mL = mmol,  and  mmol / mL = M,
 * the two cancel consistently — no litre conversion is needed anywhere, as
 * long as every volume stays in mL.
 *
 * ── MODEL ────────────────────────────────────────────────────────────────
 * Titrating an ACID (the analyte, in the flask) with a strong BASE (the
 * titrant, from the burette).
 *
 *   molHA = Ca × Va      (mmol acid initially present)
 *   molOH = Cb × Vb      (mmol strong base added so far)
 *   Vtot  = Va + Vb      (mL, assuming volumes are additive)
 *
 * STRONG ACID + STRONG BASE — the acid is fully dissociated, so it is just
 * a neutralisation subtraction:
 *   before equivalence:  [H+]  = (molHA − molOH) / Vtot     → pH = −log₁₀[H+]
 *   at equivalence:      only water and a neutral salt      → pH = 7
 *   after equivalence:   [OH−] = (molOH − molHA) / Vtot     → pH = 14 + log₁₀[OH−]
 *
 * WEAK ACID + STRONG BASE — four distinct regions:
 *   1. Vb = 0 (no titrant yet). Henderson-Hasselbalch is undefined here
 *      (log of zero), so solve the equilibrium exactly:
 *          Ka = x² / (Ca − x)  →  x² + Ka·x − Ka·Ca = 0
 *          [H+] = x = (−Ka + √(Ka² + 4·Ka·Ca)) / 2
 *   2. Buffer region (0 < molOH < molHA). A HA/A⁻ buffer exists, so use
 *      Henderson-Hasselbalch:
 *          pH = pKa + log₁₀([A⁻]/[HA]) = pKa + log₁₀(molOH / (molHA − molOH))
 *      Note this is why pH = pKa exactly at half-equivalence, and why this
 *      stretch is FLAT compared with a strong acid.
 *   3. Equivalence (molOH = molHA). All acid is now its conjugate base A⁻,
 *      which hydrolyses — so the equivalence point is BASIC, not pH 7:
 *          [A⁻]  = molHA / Vtot
 *          Kb    = Kw / Ka
 *          [OH−] = √(Kb · [A⁻])   →  pH = 14 + log₁₀[OH−]
 *   4. Past equivalence. Excess strong base swamps the hydrolysis:
 *          [OH−] = (molOH − molHA) / Vtot  →  pH = 14 + log₁₀[OH−]
 *
 * Known simplification: regions 2 and 3 are the standard textbook
 * approximations. They lose accuracy in the last fraction of a mL before
 * equivalence (where H-H assumes buffering that is nearly exhausted). The
 * curve SHAPE — flat buffer, smaller jump, basic equivalence — is correct,
 * which is what the simulation teaches. Deliberately not modelling exact
 * simultaneous equilibria.
 */

const KW = 1e-14;

/**
 * Realistic Ka window. Below ~1e-14 an acid is weaker than water itself;
 * above ~1e-1 it behaves as effectively strong and the buffer region
 * collapses. A free-form Ka outside this range would draw a chemically
 * nonsensical curve, so callers clamp into it.
 * For reference: acetic acid 1.8e-5, carbonic 4.3e-7, hydrofluoric 6.8e-4.
 */
export const KA_MIN = 1e-14;
export const KA_MAX = 1e-1;

/** pH is only meaningful across roughly 0–14 in dilute aqueous solution. */
function clampPh(ph) {
  if (!Number.isFinite(ph)) return 7;
  return Math.min(14, Math.max(0, ph));
}

export function clampKa(ka) {
  if (ka == null || !Number.isFinite(ka)) return null;
  return Math.min(KA_MAX, Math.max(KA_MIN, ka));
}

/**
 * pH of a WEAK acid before any titrant is added. Henderson-Hasselbalch is
 * undefined here (log of zero), so solve the equilibrium exactly:
 *   Ka = x²/(Ca − x)  →  x² + Ka·x − Ka·Ca = 0  →  [H+] = x
 */
export function weakInitialPh({ acidConcentration, ka }) {
  const kaVal = clampKa(ka);
  if (kaVal === null) return clampPh(-Math.log10(acidConcentration));
  const h = (-kaVal + Math.sqrt(kaVal * kaVal + 4 * kaVal * acidConcentration)) / 2;
  return clampPh(-Math.log10(h));
}

/**
 * pH at the equivalence point of a WEAK acid / strong base titration.
 * All the acid is now its conjugate base A-, which hydrolyses:
 *   [A-] = molHA / Vtot(at equivalence),  Kb = Kw / Ka,  [OH-] = sqrt(Kb·[A-])
 * Evaluated at the equivalence volume so it is a fixed reference point.
 */
export function weakEquivalencePh({
  acidConcentration,
  acidVolumeMl,
  baseConcentration,
  ka,
}) {
  const kaVal = clampKa(ka);
  if (kaVal === null) return 7;
  const molHA = acidConcentration * acidVolumeMl;
  const vEq = equivalenceVolumeMl({ acidConcentration, acidVolumeMl, baseConcentration });
  const vTotEq = acidVolumeMl + vEq;
  if (vTotEq <= 0) return 7;
  const aMinus = molHA / vTotEq;
  const kb = KW / kaVal;
  return clampPh(14 + Math.log10(Math.sqrt(kb * aMinus)));
}

/** Volume of titrant needed to exactly neutralise the acid: Vb = Ca·Va / Cb. */
export function equivalenceVolumeMl({ acidConcentration, acidVolumeMl, baseConcentration }) {
  if (!baseConcentration) return 0;
  return (acidConcentration * acidVolumeMl) / baseConcentration;
}

/**
 * pH of the flask after adding `baseVolumeMl` of titrant.
 *
 * @param {object} p
 * @param {number} p.acidConcentration  Ca, mol/L
 * @param {number} p.acidVolumeMl       Va, mL
 * @param {number} p.baseConcentration  Cb, mol/L
 * @param {number} p.baseVolumeMl       Vb, mL added so far
 * @param {number|null} [p.ka]          null/undefined => STRONG acid
 * @returns {number} pH, clamped to 0..14
 */
export function phAt({
  acidConcentration,
  acidVolumeMl,
  baseConcentration,
  baseVolumeMl,
  ka = null,
}) {
  const molHA = acidConcentration * acidVolumeMl;
  const molOH = baseConcentration * baseVolumeMl;
  const vTot = acidVolumeMl + baseVolumeMl;
  if (vTot <= 0) return 7;

  // Tolerance for "exactly at equivalence" — mmol quantities.
  const EPS = 1e-9;
  const kaVal = clampKa(ka);

  // ── Strong acid + strong base ──────────────────────────────────────────
  if (kaVal === null) {
    if (molHA - molOH > EPS) return clampPh(-Math.log10((molHA - molOH) / vTot));
    if (molOH - molHA > EPS) return clampPh(14 + Math.log10((molOH - molHA) / vTot));
    return 7; // equivalence: neutral salt
  }

  // ── Weak acid + strong base ────────────────────────────────────────────
  const pKa = -Math.log10(kaVal);

  // The equivalence pH, evaluated once at the equivalence volume so it is a
  // STABLE reference for the guards below (not recomputed from the current
  // volume, which would drift point to point).
  const phEq = weakEquivalencePh({
    acidConcentration,
    acidVolumeMl,
    baseConcentration,
    ka: kaVal,
  });

  const ph0 = weakInitialPh({ acidConcentration, ka: kaVal });

  // 1. No titrant yet — exact quadratic, H-H is undefined at Vb = 0.
  if (baseVolumeMl <= EPS) return ph0;

  // 2. Buffer region — Henderson-Hasselbalch, bounded at BOTH ends.
  //    H-H is only valid in the middle of the buffer; it breaks down at each
  //    extreme, and unbounded it would draw a curve that dips twice:
  //      · near Vb = 0 it tends to −infinity (log of ~0), because it ignores
  //        the acid's own dissociation — it would start BELOW the true
  //        initial pH, so floor it at ph0.
  //      · near equivalence it tends to +infinity (log of 1/~0), because it
  //        assumes buffering that is already exhausted — it would overshoot
  //        ABOVE the equivalence pH, so cap it at phEq.
  //    The real curve rises monotonically from ph0 to phEq, which is exactly
  //    what these two bounds preserve.
  if (molHA - molOH > EPS) {
    const hh = clampPh(pKa + Math.log10(molOH / (molHA - molOH)));
    return Math.min(Math.max(hh, ph0), phEq);
  }

  // 3. Equivalence — conjugate base hydrolysis, so pH > 7.
  if (Math.abs(molHA - molOH) <= EPS) return phEq;

  // 4. Past equivalence — excess strong base dominates.
  //    GUARD (mirror of the above): with a tiny excess of base this term
  //    alone understates the pH, because it ignores the A- hydrolysis that
  //    is still present. The curve must not dip below the equivalence pH.
  return Math.max(clampPh(14 + Math.log10((molOH - molHA) / vTot)), phEq);
}

/**
 * Sample a full titration curve.
 *
 * @returns {Array<{volume: number, ph: number}>}
 */
export function buildCurve(params, { maxVolumeMl, steps = 240 } = {}) {
  // Default span: twice the equivalence volume, so the plateau past the
  // endpoint is visible. Falls back to 50 mL if the params imply zero.
  const end = maxVolumeMl ?? (equivalenceVolumeMl(params) * 2 || 50);
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const volume = (end * i) / steps;
    points.push({ volume, ph: phAt({ ...params, baseVolumeMl: volume }) });
  }
  return points;
}

export default { phAt, buildCurve, equivalenceVolumeMl, clampKa, KA_MIN, KA_MAX };
