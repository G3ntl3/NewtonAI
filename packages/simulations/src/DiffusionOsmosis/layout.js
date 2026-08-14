/**
 * DiffusionOsmosis particle layout — PURE geometry, no React.
 *
 * Both modes run through this one pipeline: every particle gets a `start`
 * position and an `end` (equilibrium) position, and the component simply
 * transitions between the two. That is what keeps "diffusion" and "osmosis"
 * one simulation rather than two components — they differ only in how the
 * two layouts are computed, not in how they are drawn or animated.
 *
 * Kept in a plain .js file (not inside the .jsx) so the behaviour that
 * actually matters — solute never crossing the membrane, water moving the
 * right way, particles ending up evenly spread — is testable under node,
 * which cannot import .jsx.
 */

/** Container geometry in SVG viewBox units. Shared with the component. */
export const BOX = { x: 14, y: 14, w: 272, h: 130 };
export const MEMBRANE_X = BOX.x + BOX.w / 2;

/**
 * Deterministic PRNG (linear congruential). Seeded so a given set of params
 * always produces the same layout — Math.random() here would make particles
 * jump to new spots on every re-render, e.g. while dragging a slider.
 */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Random point inside a horizontal band of the container, inset from the walls. */
function pointIn(rng, xFrom, xTo, pad = 7) {
  return {
    x: xFrom + pad + rng() * Math.max(xTo - xFrom - pad * 2, 1),
    y: BOX.y + pad + rng() * Math.max(BOX.h - pad * 2, 1),
  };
}

/** Which side of the membrane a coordinate is on. */
export function sideOf(x) {
  return x < MEMBRANE_X ? 'left' : 'right';
}

/**
 * Diffusion: one particle type in an open container. They begin crowded into
 * the left portion — the higher the concentration difference, the tighter the
 * cluster — and end spread across the whole container.
 */
function buildDiffusion(rng, particleCount, difference) {
  // difference 1 -> leftmost 20% of the box; difference 0 -> already spread.
  const clusterW = BOX.w * (0.2 + 0.8 * (1 - difference));

  return Array.from({ length: particleCount }, () => ({
    type: 'solute',
    start: pointIn(rng, BOX.x, BOX.x + clusterW),
    end: pointIn(rng, BOX.x, BOX.x + BOX.w),
  }));
}

/**
 * Osmosis: a membrane splits the container. Solute is unevenly distributed and
 * CANNOT cross — its start and end positions are identical, and both stay on
 * the same side. Water starts evenly split and ends with a net shift toward
 * whichever side holds more solute.
 */
function buildOsmosis(rng, particleCount, difference) {
  const soluteCount = Math.max(2, Math.round(particleCount * 0.35));
  const waterCount = particleCount - soluteCount;

  // difference 1 -> all solute on the right; 0 -> evenly split.
  const soluteRight = Math.round(soluteCount * (0.5 + 0.5 * difference));
  const soluteLeft = soluteCount - soluteRight;

  const particles = [];

  for (let i = 0; i < soluteLeft; i += 1) {
    const at = pointIn(rng, BOX.x, MEMBRANE_X);
    particles.push({ type: 'solute', start: at, end: at }); // cannot cross
  }
  for (let i = 0; i < soluteRight; i += 1) {
    const at = pointIn(rng, MEMBRANE_X, BOX.x + BOX.w);
    particles.push({ type: 'solute', start: at, end: at }); // cannot cross
  }

  // Water begins evenly split, then a share proportional to the gradient
  // moves to the higher-solute (right) side.
  const waterRightStart = Math.round(waterCount / 2);
  const waterLeftStart = waterCount - waterRightStart;
  const waterRightEnd = Math.min(
    waterCount,
    Math.round(waterCount * (0.5 + 0.4 * difference))
  );
  const moversToRight = Math.max(0, waterRightEnd - waterRightStart);

  for (let i = 0; i < waterLeftStart; i += 1) {
    const start = pointIn(rng, BOX.x, MEMBRANE_X);
    // The first `moversToRight` left-side water particles cross over.
    const end = i < moversToRight ? pointIn(rng, MEMBRANE_X, BOX.x + BOX.w) : start;
    particles.push({ type: 'water', start, end });
  }
  for (let i = 0; i < waterRightStart; i += 1) {
    const at = pointIn(rng, MEMBRANE_X, BOX.x + BOX.w);
    particles.push({ type: 'water', start: at, end: at });
  }

  return particles;
}

/**
 * Build the particle set for a mode.
 *
 * @param {{mode: string, particleCount: number, initialConcentrationDifference: number}} params
 * @returns {Array<{type: 'solute'|'water', start: {x,y}, end: {x,y}}>}
 */
export function buildParticles({ mode, particleCount, initialConcentrationDifference }) {
  // Seed from the params so the same inputs always yield the same layout.
  const rng = makeRng(
    particleCount * 7919 + Math.round(initialConcentrationDifference * 1000) * 104729 +
      (mode === 'osmosis' ? 31 : 17)
  );

  return mode === 'osmosis'
    ? buildOsmosis(rng, particleCount, initialConcentrationDifference)
    : buildDiffusion(rng, particleCount, initialConcentrationDifference);
}

export default buildParticles;
