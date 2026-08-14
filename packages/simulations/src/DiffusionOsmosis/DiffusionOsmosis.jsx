'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildParticles, BOX, MEMBRANE_X } from './layout.js';

const VIEW_W = 300;
const VIEW_H = 158;
const TRANSITION = 'transform 1600ms cubic-bezier(0.4, 0, 0.2, 1)';

const COPY = {
  diffusion: {
    title: 'Diffusion',
    start: 'The particles are crowded on one side — that difference is the concentration gradient.',
    end: 'Particles spread from where they are crowded to where they are sparse, until they are evenly mixed.',
  },
  osmosis: {
    title: 'Osmosis',
    start: 'More solute sits on the right. Water can cross the membrane; the solute cannot.',
    end: 'Water has moved across the membrane toward the side with more solute, until both sides balance.',
  },
};

/**
 * DiffusionOsmosis
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. One simulation,
 * two modes, sharing a single particle pipeline (see layout.js): every
 * particle carries a start and an equilibrium position, and "Run" simply
 * transitions between them via CSS. Deliberately NOT a physics loop — no
 * requestAnimationFrame, no per-frame state, just one interpolation.
 */
export default function DiffusionOsmosis({ mode, particleCount, initialConcentrationDifference }) {
  const [count, setCount] = useState(particleCount);
  const [difference, setDifference] = useState(initialConcentrationDifference);
  const [settled, setSettled] = useState(false);

  const particles = useMemo(
    () => buildParticles({ mode, particleCount: count, initialConcentrationDifference: difference }),
    [mode, count, difference]
  );

  // Changing the setup rebuilds the layout, so return to the start state —
  // otherwise the sim would show a fresh gradient already labelled "settled".
  useEffect(() => {
    setSettled(false);
  }, [mode, count, difference]);

  const copy = COPY[mode] ?? COPY.diffusion;
  const isOsmosis = mode === 'osmosis';

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm">Diffusion &amp; Osmosis</p>
      <p className="text-newton-blue-mid text-xs font-medium mt-0.5 mb-3">{copy.title}</p>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto bg-newton-bg/[0.03] rounded-lg"
        role="img"
        aria-label={`${copy.title}: ${settled ? copy.end : copy.start}`}
      >
        {/* Container */}
        <rect
          x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="6"
          fill="none" stroke="currentColor" className="text-newton-bg/25" strokeWidth="2"
        />

        {/* Membrane — osmosis only. Dashed to read as semi-permeable. */}
        {isOsmosis && (
          <line
            x1={MEMBRANE_X} y1={BOX.y} x2={MEMBRANE_X} y2={BOX.y + BOX.h}
            stroke="currentColor" className="text-newton-bg/45"
            strokeWidth="3" strokeDasharray="5 4"
          />
        )}

        {particles.map((p, i) => {
          const at = settled ? p.end : p.start;
          const isWater = p.type === 'water';
          return (
            <circle
              key={i}
              cx={0}
              cy={0}
              r={isWater ? 2.6 : 4}
              className={isWater ? 'fill-newton-cyan' : 'fill-newton-blue-mid'}
              style={{ transform: `translate(${at.x}px, ${at.y}px)`, transition: TRANSITION }}
            />
          );
        })}
      </svg>

      {/* Legend — only meaningful when two particle types exist. */}
      {isOsmosis && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-newton-bg/60 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-newton-cyan" /> Water (crosses)
          </span>
          <span className="flex items-center gap-1.5 text-newton-bg/60 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-newton-blue-mid" /> Solute (cannot cross)
          </span>
        </div>
      )}

      <p className="text-newton-bg/70 text-xs leading-relaxed mt-3 text-center">
        {settled ? copy.end : copy.start}
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Particles: {count}</span>
          <input
            type="range" min={10} max={80} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">
            Concentration difference: {Math.round(difference * 100)}%
          </span>
          <input
            type="range" min={0} max={1} step={0.05} value={difference}
            onChange={(e) => setDifference(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSettled(true)}
            disabled={settled}
            className="flex-1 py-2 rounded-xl bg-newton-blue-mid hover:bg-newton-blue-bright disabled:opacity-40 disabled:hover:bg-newton-blue-mid text-white text-xs font-semibold transition-colors"
          >
            Run
          </button>
          <button
            type="button"
            onClick={() => setSettled(false)}
            disabled={!settled}
            className="flex-1 py-2 rounded-xl border border-newton-bg/15 text-newton-bg/70 hover:bg-newton-bg/[0.04] disabled:opacity-40 text-xs font-semibold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
