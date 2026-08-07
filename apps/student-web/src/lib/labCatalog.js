import { simulationBank } from '@newton/simulations/src/simulationBank.js';

// Estimated duration for each real, tappable sim — short sandbox
// explorations. Keyed by simulationId; falls back to a sensible default.
const LIVE_DURATIONS = {
  'projectile-motion': '10 min',
  'graph-explorer': '8 min',
  'quadratic-explorer': '8 min',
  'ohms-law': '10 min',
};
const DEFAULT_LIVE_DURATION = '10 min';

// Short UI subtitle shown under the sim's title on its detail page — display
// copy only, not sent to the AI (that's simulationBank's `fits`/`doesNotFit`).
const LIVE_SUBTITLES = {
  'projectile-motion': 'Explore range and height as angle and speed change',
  'graph-explorer': 'See how slope and intercept shape the line',
  'quadratic-explorer': 'See how a, b, and c shape the parabola',
  'ohms-law': 'Explore current as voltage and resistance change',
};

// The core formula shown under each sim, via the formula learning block
// (FormulaBlock.jsx / KaTeX) — same rendering the AI uses in chat.
const LIVE_FORMULAS = {
  'projectile-motion': { latex: 'R = \\frac{v^2 \\sin(2\\theta)}{g}', caption: 'Range of a projectile' },
  'graph-explorer': { latex: 'y = mx + c', caption: 'Equation of a line' },
  'quadratic-explorer': { latex: 'y = ax^2 + bx + c', caption: 'Quadratic equation' },
  'ohms-law': { latex: 'I = \\frac{V}{R}', caption: "Ohm's Law" },
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
  { title: 'Osmosis', subject: 'biology', estimatedTime: '12 min' },
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
    subject: meta.subject,
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
