import { simulationBank } from '@newton/simulations/src/simulationBank.js';

// simulationBank.js entries carry AI-facing metadata only (title/concepts/
// fits/doesNotFit/paramHints — see that file's own docstring), never a UI
// subject — so the Lab screen's subject tabs need their own mapping here.
const LIVE_SUBJECTS = {
  'projectile-motion': 'physics',
  'graph-explorer': 'maths',
  'quadratic-explorer': 'maths',
  'ohms-law': 'physics',
  'gas-laws': 'chemistry',
  'diffusion-osmosis': 'biology',
  titration: 'chemistry',
};

// Estimated duration for each real, tappable sim — short sandbox
// explorations. Keyed by simulationId; falls back to a sensible default.
const LIVE_DURATIONS = {
  'projectile-motion': '10 min',
  'graph-explorer': '8 min',
  'quadratic-explorer': '8 min',
  'ohms-law': '10 min',
  'gas-laws': '12 min',
  'diffusion-osmosis': '12 min',
  titration: '15 min',
};
const DEFAULT_LIVE_DURATION = '10 min';

// Short UI subtitle shown under the sim's title on its detail page — display
// copy only, not sent to the AI (that's simulationBank's `fits`/`doesNotFit`).
const LIVE_SUBTITLES = {
  'projectile-motion': 'Explore range and height as angle and speed change',
  'graph-explorer': 'See how slope and intercept shape the line',
  'quadratic-explorer': 'See how a, b, and c shape the parabola',
  'ohms-law': 'Explore current as voltage and resistance change',
  'gas-laws': 'Hold one property constant and watch the other two respond',
  'diffusion-osmosis': 'Watch particles spread down a concentration gradient',
  titration: 'Run a burette to the endpoint and find the average titre',
};

// The core formula shown under each sim, via the formula learning block
// (FormulaBlock.jsx / KaTeX) — same rendering the AI uses in chat.
const LIVE_FORMULAS = {
  'projectile-motion': { latex: 'R = \\frac{v^2 \\sin(2\\theta)}{g}', caption: 'Range of a projectile' },
  'graph-explorer': { latex: 'y = mx + c', caption: 'Equation of a line' },
  'quadratic-explorer': { latex: 'y = ax^2 + bx + c', caption: 'Quadratic equation' },
  'ohms-law': { latex: 'I = \\frac{V}{R}', caption: "Ohm's Law" },
  // Boyle's Law shown as the representative case — the sim covers all three
  // via its mode selector, and its own card states the active law.
  'gas-laws': { latex: 'P_1 V_1 = P_2 V_2', caption: "Boyle's Law (constant temperature)" },
  'diffusion-osmosis': { latex: '\\text{high concentration} \\rightarrow \\text{low concentration}', caption: 'Movement down a concentration gradient' },
  // The titration calculation itself. The sim also draws the pH curve; for a
  // weak acid the buffer region follows Henderson-Hasselbalch (see that sim's
  // chemistry.js), but this 1:1 relation is what the practical is marked on.
  titration: { latex: 'C_a V_a = C_b V_b', caption: 'Neutralisation at the equivalence point (1:1)' },
};

// Variable glossary shown under the formula on each sim's detail page —
// what each symbol in that sim's formula stands for, in plain terms.
const LIVE_VARIABLES = {
  'projectile-motion': [
    { symbol: 'R', meaning: 'Range — horizontal distance travelled (m)' },
    { symbol: 'v', meaning: 'Launch speed (m/s)' },
    { symbol: 'θ', meaning: 'Launch angle (degrees)' },
    { symbol: 'g', meaning: 'Acceleration due to gravity (9.8 m/s²)' },
  ],
  'graph-explorer': [
    { symbol: 'y', meaning: 'Vertical value (output)' },
    { symbol: 'x', meaning: 'Horizontal value (input)' },
    { symbol: 'm', meaning: 'Slope (gradient) — how steep the line is' },
    { symbol: 'c', meaning: 'Y-intercept — where the line crosses the y-axis' },
  ],
  'quadratic-explorer': [
    { symbol: 'y', meaning: 'Vertical value (output)' },
    { symbol: 'x', meaning: 'Horizontal value (input)' },
    { symbol: 'a', meaning: "Quadratic coefficient — shapes the curve's width and direction" },
    { symbol: 'b', meaning: 'Linear coefficient' },
    { symbol: 'c', meaning: 'Constant term — where the curve crosses the y-axis (at x = 0)' },
  ],
  'ohms-law': [
    { symbol: 'I', meaning: 'Current (amperes, A)' },
    { symbol: 'V', meaning: 'Voltage (volts, V) — the source EMF' },
    { symbol: 'R', meaning: 'Resistance (ohms, Ω)' },
  ],
  'gas-laws': [
    { symbol: 'P', meaning: 'Pressure (atmospheres, atm)' },
    { symbol: 'V', meaning: 'Volume (litres, L)' },
    { symbol: 'T', meaning: 'Temperature (kelvin, K) — always absolute, never Celsius' },
    { symbol: '₁ ₂', meaning: 'Before and after the change (state 1, state 2)' },
  ],
  'diffusion-osmosis': [
    { symbol: 'Solute', meaning: 'The dissolved substance — cannot cross the membrane' },
    { symbol: 'Water', meaning: 'The solvent — crosses the membrane freely' },
    { symbol: 'Gradient', meaning: 'The difference in concentration between two areas' },
    { symbol: 'Passive', meaning: 'Movement needing no energy — driven by the gradient alone' },
  ],
  titration: [
    { symbol: 'Cₐ', meaning: 'Concentration of the acid in the flask (mol/L)' },
    { symbol: 'Vₐ', meaning: 'Volume of acid pipetted into the flask (mL)' },
    { symbol: 'C_b', meaning: 'Concentration of the base in the burette (mol/L)' },
    { symbol: 'V_b', meaning: 'Titre — volume of base added to reach the endpoint (mL)' },
    { symbol: 'Equivalence', meaning: 'Where acid and base exactly cancel — pH 7 for a strong acid, above 7 for a weak one' },
    { symbol: 'Endpoint', meaning: 'Where the indicator changes colour — as close to equivalence as the indicator allows' },
    { symbol: 'Kₐ', meaning: 'Acid dissociation constant — only for a weak acid; larger means stronger' },
  ],
};

/**
 * Planned experiments with NO built simulation yet. Deliberately a separate
 * list from simulationBank (never merged into one shape until the return
 * of getLabCatalog below) so there is never any ambiguity about which
 * experiments are real: only entries here can ever render as "coming soon",
 * and only simulationBank entries can ever be tappable.
 */
export const comingSoonExperiments = [
  { title: 'Simple Pendulum', subject: 'physics', estimatedTime: '10 min' },
  { title: 'Refraction of Light', subject: 'physics', estimatedTime: '10 min' },
  { title: 'Rates of Reaction', subject: 'chemistry', estimatedTime: '15 min' },
  { title: 'Electrolysis', subject: 'chemistry', estimatedTime: '15 min' },
  // 'Osmosis' was listed here until the diffusion-osmosis sim was built —
  // removed so the Lab doesn't show a "coming soon" card for something that
  // now has a working, tappable one.
  { title: 'Food Tests', subject: 'biology', estimatedTime: '12 min' },
  { title: 'Onion Cells Under a Microscope', subject: 'biology', estimatedTime: '10 min' },
];

/**
 * Full Lab catalog: real sims from simulationBank (available: true,
 * tappable, carries a simulationId) merged with the coming-soon list
 * (available: false, simulationId: null, never tappable). Adding a new sim
 * to simulationBank.js makes its card appear here automatically — nothing
 * in this file or the Lab screen needs to change for that.
 */
export function getLabCatalog() {
  const live = Object.entries(simulationBank).map(([simulationId, meta]) => ({
    simulationId,
    title: meta.title,
    subject: LIVE_SUBJECTS[simulationId] ?? null,
    estimatedTime: LIVE_DURATIONS[simulationId] ?? DEFAULT_LIVE_DURATION,
    subtitle: LIVE_SUBTITLES[simulationId] ?? '',
    formula: LIVE_FORMULAS[simulationId] ?? null,
    variables: LIVE_VARIABLES[simulationId] ?? [],
    available: true,
  }));

  const comingSoon = comingSoonExperiments.map((entry) => ({
    ...entry,
    simulationId: null,
    available: false,
  }));

  return [...live, ...comingSoon];
}
