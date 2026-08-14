import { phAt, buildCurve, equivalenceVolumeMl, clampKa, KA_MIN, KA_MAX }
  from '../packages/simulations/src/Titration/chemistry.js';

let failed = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} — ${m}`); if (!c) failed++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// Classic school titration: 25.00 mL of 0.100 M acid vs 0.100 M NaOH.
const STRONG = { acidConcentration: 0.1, acidVolumeMl: 25, baseConcentration: 0.1, ka: null };
const ACETIC = { ...STRONG, ka: 1.8e-5 }; // acetic acid, pKa 4.74

const vEq = equivalenceVolumeMl(STRONG);
console.log(`equivalence volume = ${vEq.toFixed(2)} mL\n`);
ok(near(vEq, 25, 1e-9), 'equivalence at 25.00 mL (Ca·Va/Cb)');

// ── STRONG ACID + STRONG BASE ────────────────────────────────────────────
console.log('--- STRONG acid vs strong base (0.1 M HCl / 0.1 M NaOH) ---');
const strongPts = [0, 5, 12.5, 20, 24.9, 25, 25.1, 30, 50];
for (const v of strongPts) {
  console.log(`  Vb=${String(v).padStart(5)} mL   pH = ${phAt({ ...STRONG, baseVolumeMl: v }).toFixed(2)}`);
}
const sAt = (v) => phAt({ ...STRONG, baseVolumeMl: v });
ok(near(sAt(0), 1.0, 0.01), `starts strongly acidic: pH ${sAt(0).toFixed(2)} ≈ 1.00 (0.1 M H+)`);
ok(near(sAt(25), 7, 1e-9), `equivalence exactly pH 7.00 (got ${sAt(25).toFixed(2)})`);
ok(sAt(50) > 12, `levels off strongly basic: pH ${sAt(50).toFixed(2)} > 12`);
const strongJump = sAt(25.1) - sAt(24.9);
ok(strongJump > 6, `STEEP jump across equivalence: ${sAt(24.9).toFixed(2)} → ${sAt(25.1).toFixed(2)} = ${strongJump.toFixed(2)} pH units in 0.2 mL`);
ok(sAt(0) < sAt(12.5) && sAt(12.5) < sAt(24.9), 'monotonically rising before equivalence');

// ── WEAK ACID + STRONG BASE ──────────────────────────────────────────────
console.log('\n--- WEAK acid vs strong base (0.1 M acetic, Ka 1.8e-5 / 0.1 M NaOH) ---');
for (const v of strongPts) {
  console.log(`  Vb=${String(v).padStart(5)} mL   pH = ${phAt({ ...ACETIC, baseVolumeMl: v }).toFixed(2)}`);
}
const wAt = (v) => phAt({ ...ACETIC, baseVolumeMl: v });

ok(near(wAt(0), 2.87, 0.03), `initial pH ${wAt(0).toFixed(2)} ≈ textbook 2.87 (exact quadratic, not √(Ka·Ca))`);
ok(near(wAt(12.5), 4.74, 0.01), `HALF-equivalence pH ${wAt(12.5).toFixed(2)} = pKa 4.74 — the buffer signature`);
ok(wAt(25) > 8 && wAt(25) < 9, `equivalence is BASIC, not 7: pH ${wAt(25).toFixed(2)} (textbook ≈ 8.72)`);
ok(near(wAt(25), 8.72, 0.05), `equivalence pH ${wAt(25).toFixed(2)} ≈ textbook 8.72`);

// Buffer region must be FLATTER than the strong-acid equivalent stretch.
const weakBufferRise = wAt(20) - wAt(5);
const strongSameRange = sAt(20) - sAt(5);
console.log(`\n  buffer flatness  weak: ${wAt(5).toFixed(2)} → ${wAt(20).toFixed(2)} (Δ ${weakBufferRise.toFixed(2)})`);
console.log(`                 strong: ${sAt(5).toFixed(2)} → ${sAt(20).toFixed(2)} (Δ ${strongSameRange.toFixed(2)})`);
ok(weakBufferRise < 1.5, `weak acid has a FLAT buffer region (Δ${weakBufferRise.toFixed(2)} pH over 15 mL)`);
ok(wAt(5) > sAt(5) + 2, `buffer sits well above the strong-acid curve (${wAt(5).toFixed(2)} vs ${sAt(5).toFixed(2)})`);

// The weak-acid jump must be visibly SMALLER than the strong-acid jump.
const weakJump = wAt(25.1) - wAt(24.9);
console.log(`  jump size        weak: ${weakJump.toFixed(2)}   strong: ${strongJump.toFixed(2)} pH units`);
ok(weakJump < strongJump - 2, `weak jump ${weakJump.toFixed(2)} is markedly SMALLER than strong ${strongJump.toFixed(2)}`);
ok(weakJump > 1.5, `weak jump ${weakJump.toFixed(2)} is still a real, detectable endpoint`);

// Both converge once excess strong base dominates.
ok(near(wAt(50), sAt(50), 0.01), `past equivalence both converge (weak ${wAt(50).toFixed(2)} / strong ${sAt(50).toFixed(2)}) — excess NaOH dominates`);

// ── Monotonicity + bounds across the whole curve ─────────────────────────
for (const [label, params] of [['strong', STRONG], ['weak', ACETIC]]) {
  const curve = buildCurve(params, { maxVolumeMl: 50, steps: 500 });
  const monotonic = curve.every((p, i) => i === 0 || p.ph >= curve[i - 1].ph - 1e-9);
  const bounded = curve.every((p) => p.ph >= 0 && p.ph <= 14 && Number.isFinite(p.ph));
  ok(monotonic, `${label}: pH rises monotonically across 500 samples (no kinks or dips)`);
  ok(bounded, `${label}: every pH finite and within 0–14`);
}

// ── Ka guard rails ───────────────────────────────────────────────────────
console.log('\n--- Ka bounds ---');
ok(clampKa(1) === KA_MAX, `Ka 1 (nonsensically strong) clamped to ${KA_MAX}`);
ok(clampKa(1e-20) === KA_MIN, `Ka 1e-20 (weaker than water) clamped to ${KA_MIN}`);
ok(clampKa(1.8e-5) === 1.8e-5, 'realistic Ka passes through untouched');
ok(clampKa(null) === null, 'null Ka stays null (strong acid)');
ok(Number.isFinite(phAt({ ...STRONG, ka: 1e-30, baseVolumeMl: 12.5 })), 'absurd Ka still yields a finite pH (clamped, no NaN)');

// A very weak acid should push equivalence even higher.
const veryWeak = phAt({ ...STRONG, ka: 1e-9, baseVolumeMl: 25 });
console.log(`  Ka 1e-9 equivalence pH = ${veryWeak.toFixed(2)}`);
ok(veryWeak > wAt(25), `weaker acid (Ka 1e-9) gives a MORE basic equivalence: ${veryWeak.toFixed(2)} > ${wAt(25).toFixed(2)}`);

console.log(failed === 0 ? '\nPHASE 1: ALL PASS' : `\nPHASE 1: ${failed} FAILED`);
process.exitCode = failed ? 1 : 0;
