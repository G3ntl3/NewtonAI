'use client';

import { useState } from 'react';

const LIMITS = {
  pressure: { min: 0.5, max: 10, step: 0.1, unit: 'atm', symbol: 'P', label: 'Pressure' },
  volume: { min: 1, max: 20, step: 0.1, unit: 'L', symbol: 'V', label: 'Volume' },
  temperature: { min: 200, max: 500, step: 1, unit: 'K', symbol: 'T', label: 'Temperature' },
};

/**
 * One entry per mode. `held` is the variable kept constant, which selects the
 * law; `vars` are the two that move. `invariant` is the quantity the law says
 * stays fixed, computed once from the opening params — dragging either slider
 * solves for the other so the invariant is never violated.
 */
const MODES = {
  'constant-temperature': {
    law: "Boyle's Law",
    held: 'temperature',
    vars: ['pressure', 'volume'],
    formula: 'P₁ × V₁ = P₂ × V₂',
    invariant: (s) => s.pressure * s.volume,
    solve: (k, key, value) =>
      key === 'pressure' ? { volume: k / value } : { pressure: k / value },
    range: (k, key) =>
      key === 'pressure'
        ? [k / LIMITS.volume.max, k / LIMITS.volume.min]
        : [k / LIMITS.pressure.max, k / LIMITS.pressure.min],
  },
  'constant-pressure': {
    law: "Charles's Law",
    held: 'pressure',
    vars: ['volume', 'temperature'],
    formula: 'V₁ / T₁ = V₂ / T₂',
    invariant: (s) => s.volume / s.temperature,
    solve: (k, key, value) =>
      key === 'volume' ? { temperature: value / k } : { volume: k * value },
    range: (k, key) =>
      key === 'volume'
        ? [k * LIMITS.temperature.min, k * LIMITS.temperature.max]
        : [LIMITS.volume.min / k, LIMITS.volume.max / k],
  },
  'constant-volume': {
    law: "Gay-Lussac's Law",
    held: 'volume',
    vars: ['pressure', 'temperature'],
    formula: 'P₁ / T₁ = P₂ / T₂',
    invariant: (s) => s.pressure / s.temperature,
    solve: (k, key, value) =>
      key === 'pressure' ? { temperature: value / k } : { pressure: k * value },
    range: (k, key) =>
      key === 'pressure'
        ? [k * LIMITS.temperature.min, k * LIMITS.temperature.max]
        : [LIMITS.pressure.min / k, LIMITS.pressure.max / k],
  },
};

/**
 * Slider bounds for a coupled variable: its own hard limits intersected with
 * the range over which its PARTNER stays in bounds. Without this the student
 * could drag one slider to a value implying, say, a 60 L volume the sim
 * cannot show, and the pair would silently stop satisfying the law.
 */
function effectiveRange(mode, k, key) {
  const own = LIMITS[key];
  const [lo, hi] = MODES[mode].range(k, key);
  return {
    min: Math.max(own.min, Math.min(lo, hi)),
    max: Math.min(own.max, Math.max(lo, hi)),
  };
}

function fmt(value, key) {
  return key === 'temperature' ? Math.round(value) : Number(value.toFixed(2));
}

// Fixed scatter — the gas holds the same number of particles throughout, so
// density (not count) is what visibly changes. Hardcoded rather than random
// so particles don't reshuffle on every slider tick.
const PARTICLES = [
  [0.16, 0.12], [0.51, 0.07], [0.83, 0.16], [0.28, 0.24], [0.68, 0.28],
  [0.09, 0.35], [0.42, 0.38], [0.91, 0.41], [0.61, 0.48], [0.22, 0.52],
  [0.77, 0.57], [0.36, 0.63], [0.06, 0.68], [0.55, 0.71], [0.88, 0.74],
  [0.19, 0.81], [0.47, 0.86], [0.72, 0.89], [0.31, 0.94], [0.63, 0.97],
];

/**
 * GasLaws
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. One simulation
 * with a MODE selector: the mode names the variable held constant, which
 * selects the law. Dragging either free slider solves for its partner
 * through that law, so the relationship always holds exactly. Static
 * redraw on change — no animation loop.
 */
export default function GasLaws({ mode, pressure, volume, temperature }) {
  const initial = { pressure, volume, temperature };
  const config = MODES[mode] ?? MODES['constant-temperature'];
  const k = config.invariant(initial);

  const [state, setState] = useState(initial);

  function handleChange(key, rawValue) {
    const value = Number(rawValue);
    setState((prev) => ({ ...prev, [key]: value, ...config.solve(k, key, value) }));
  }

  const heldMeta = LIMITS[config.held];

  // Container geometry — height tracks volume, so the gas visibly compresses.
  const VIEW_W = 300;
  const VIEW_H = 190;
  const BOX_X = 96;
  const BOX_W = 108;
  const FLOOR_Y = 168;
  const MAX_H = 132;
  const gasH = Math.max(10, (state.volume / LIMITS.volume.max) * MAX_H);
  const gasTop = FLOOR_Y - gasH;

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm">Gas Laws</p>
      <p className="text-newton-blue-mid text-xs font-medium mt-0.5 mb-3">
        {heldMeta.label} held constant · {config.law}
      </p>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto bg-newton-bg/[0.03] rounded-lg"
        role="img"
        aria-label={`Gas container at ${fmt(state.pressure, 'pressure')} atmospheres and ${fmt(state.volume, 'volume')} litres`}
      >
        {/* Cylinder walls + floor */}
        <line x1={BOX_X} y1={28} x2={BOX_X} y2={FLOOR_Y} stroke="currentColor" className="text-newton-bg/25" strokeWidth="2" />
        <line x1={BOX_X + BOX_W} y1={28} x2={BOX_X + BOX_W} y2={FLOOR_Y} stroke="currentColor" className="text-newton-bg/25" strokeWidth="2" />
        <line x1={BOX_X - 6} y1={FLOOR_Y} x2={BOX_X + BOX_W + 6} y2={FLOOR_Y} stroke="currentColor" className="text-newton-bg/40" strokeWidth="3" />

        {/* Gas region */}
        <rect x={BOX_X} y={gasTop} width={BOX_W} height={gasH} className="fill-newton-blue-mid/10" />

        {/* Particles — constant count, so they crowd together as volume falls */}
        {PARTICLES.map(([px, py], i) => (
          <circle
            key={i}
            cx={BOX_X + 6 + px * (BOX_W - 12)}
            cy={gasTop + 5 + py * Math.max(gasH - 10, 1)}
            r="2.5"
            className="fill-newton-blue-mid"
          />
        ))}

        {/* Piston */}
        <rect x={BOX_X - 4} y={gasTop - 7} width={BOX_W + 8} height="7" rx="2" className="fill-newton-bg/70" />
        <rect x={BOX_X + BOX_W / 2 - 3} y={gasTop - 20} width="6" height="13" className="fill-newton-bg/40" />

        {/* Pressure arrows pressing on the piston */}
        <text x={BOX_X + BOX_W / 2} y={gasTop - 26} textAnchor="middle" className="fill-newton-bg/50" fontSize="10">
          P = {fmt(state.pressure, 'pressure')} atm
        </text>

        {/* Volume bracket */}
        <text x={BOX_X + BOX_W + 14} y={(gasTop + FLOOR_Y) / 2} className="fill-newton-bg/50" fontSize="10">
          {fmt(state.volume, 'volume')} L
        </text>
        <text x={BOX_X - 12} y={FLOOR_Y + 14} textAnchor="middle" className="fill-newton-orange" fontSize="10">
          {fmt(state.temperature, 'temperature')} K
        </text>
      </svg>

      {/* Worked relationship: opening state vs current state */}
      <p className="text-center text-newton-bg font-semibold text-sm mt-3">{config.formula}</p>
      <p className="text-center text-newton-bg/60 text-xs mt-1">
        {config.held === 'temperature'
          ? `${fmt(initial.pressure, 'pressure')} × ${fmt(initial.volume, 'volume')} = ${fmt(k, 'volume')} = ${fmt(state.pressure, 'pressure')} × ${fmt(state.volume, 'volume')}`
          : config.held === 'pressure'
          ? `${fmt(initial.volume, 'volume')} / ${fmt(initial.temperature, 'temperature')} = ${k.toFixed(4)} = ${fmt(state.volume, 'volume')} / ${fmt(state.temperature, 'temperature')}`
          : `${fmt(initial.pressure, 'pressure')} / ${fmt(initial.temperature, 'temperature')} = ${k.toFixed(4)} = ${fmt(state.pressure, 'pressure')} / ${fmt(state.temperature, 'temperature')}`}
      </p>

      {/* Held-constant readout */}
      <p className="text-center text-newton-bg/45 text-[11px] mt-2">
        {heldMeta.label} fixed at {fmt(state[config.held], config.held)} {heldMeta.unit}
      </p>

      <div className="mt-4 space-y-3">
        {config.vars.map((key) => {
          const meta = LIMITS[key];
          const { min, max } = effectiveRange(mode, k, key);
          return (
            <label key={key} className="block">
              <span className="text-newton-bg/60 text-xs">
                {meta.label} ({meta.symbol}): {fmt(state[key], key)} {meta.unit}
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={meta.step}
                value={state[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full accent-newton-blue-mid"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
