'use client';

import { useState } from 'react';

function computeCurrent(voltage, resistance) {
  return voltage / resistance;
}

/**
 * OhmsLaw
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. Renders a single
 * series circuit (battery + resistor + wires) and the derived current,
 * redrawing labels when the sliders change. No animation loop — a static
 * diagram whose labels update live. Single-loop series circuit only.
 */
export default function OhmsLaw({ voltage, resistance }) {
  const [v, setV] = useState(voltage);
  const [r, setR] = useState(resistance);

  const current = computeCurrent(v, r);

  const VIEW_W = 300;
  const VIEW_H = 190;
  const LEFT_X = 46;
  const RIGHT_X = 254;
  const TOP_Y = 34;
  const BOTTOM_Y = 156;

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm mb-3">Ohm's Law Circuit</p>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto bg-newton-bg/[0.03] rounded-lg" role="img" aria-label="Series circuit with a battery and a resistor">
        {/* Top wire */}
        <line x1={LEFT_X} y1={TOP_Y} x2={RIGHT_X} y2={TOP_Y} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        {/* Bottom wire */}
        <line x1={LEFT_X} y1={BOTTOM_Y} x2={RIGHT_X} y2={BOTTOM_Y} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />

        {/* Left wire (split around the battery symbol) */}
        <line x1={LEFT_X} y1={TOP_Y} x2={LEFT_X} y2={80} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        <line x1={LEFT_X} y1={110} x2={LEFT_X} y2={BOTTOM_Y} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        {/* Battery symbol: long thin plate (+), short thick plate (-) */}
        <line x1={LEFT_X - 12} y1={80} x2={LEFT_X + 12} y2={80} stroke="currentColor" className="text-newton-bg" strokeWidth="2" />
        <line x1={LEFT_X - 7} y1={95} x2={LEFT_X + 7} y2={95} stroke="currentColor" className="text-newton-bg" strokeWidth="4" />
        <text x={LEFT_X - 22} y={78} className="fill-newton-bg/50" fontSize="11">+</text>
        <text x={LEFT_X - 22} y={104} className="fill-newton-bg/50" fontSize="11">−</text>

        {/* Right wire (split around the resistor box) */}
        <line x1={RIGHT_X} y1={TOP_Y} x2={RIGHT_X} y2={78} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        <line x1={RIGHT_X} y1={112} x2={RIGHT_X} y2={BOTTOM_Y} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        {/* Resistor box */}
        <rect x={RIGHT_X - 14} y={78} width="28" height="34" rx="3" fill="none" stroke="currentColor" className="text-newton-bg" strokeWidth="2" />
        <text x={RIGHT_X + 22} y={99} className="fill-newton-bg/70 font-semibold" fontSize="12">R</text>

        {/* Current label on the top wire */}
        <text x={VIEW_W / 2} y={TOP_Y - 10} textAnchor="middle" className="fill-newton-blue-mid font-semibold" fontSize="12">
          I = {current.toFixed(2)} A
        </text>
        {/* Current direction arrow along the top wire */}
        <polygon points={`${VIEW_W / 2 - 4},${TOP_Y - 4} ${VIEW_W / 2 + 4},${TOP_Y - 4} ${VIEW_W / 2},${TOP_Y + 3}`} className="fill-newton-blue-mid" />
      </svg>

      <p className="text-center text-newton-bg font-semibold text-sm mt-2">
        I = V / R = {v}V / {r.toFixed(r % 1 === 0 ? 0 : 1)}Ω = {current.toFixed(2)} A
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Voltage (V): {v} V</span>
          <input
            type="range"
            min={1}
            max={24}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Resistance (R): {r} Ω</span>
          <input
            type="range"
            min={0.5}
            max={50}
            step={0.5}
            value={r}
            onChange={(e) => setR(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
      </div>
    </div>
  );
}
