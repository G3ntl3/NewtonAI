'use client';

import { useState } from 'react';

const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -10;
const Y_MAX = 10;
const GRID_STEP = 2;

function formatEquation(m, c) {
  if (c === 0) return `y = ${m}x`;
  return c > 0 ? `y = ${m}x + ${c}` : `y = ${m}x - ${Math.abs(c)}`;
}

/**
 * GraphExplorer
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. Renders a static
 * straight line y = mx + c on a fixed coordinate grid, redrawing when the
 * sliders change. Linear only — no animation, no expression parsing.
 */
export default function GraphExplorer({ m, c }) {
  const [slope, setSlope] = useState(m);
  const [intercept, setIntercept] = useState(c);

  const VIEW_W = 300;
  const VIEW_H = 200;
  const PAD = 12;
  const scaleX = (VIEW_W - PAD * 2) / (X_MAX - X_MIN);
  const scaleY = (VIEW_H - PAD * 2) / (Y_MAX - Y_MIN);

  const toPx = (x) => PAD + (x - X_MIN) * scaleX;
  const toPy = (y) => VIEW_H - PAD - (y - Y_MIN) * scaleY;

  const x1 = X_MIN;
  const x2 = X_MAX;
  const y1 = slope * x1 + intercept;
  const y2 = slope * x2 + intercept;

  const gridLines = [];
  for (let v = X_MIN; v <= X_MAX; v += GRID_STEP) {
    gridLines.push({ type: 'v', pos: toPx(v) });
  }
  for (let v = Y_MIN; v <= Y_MAX; v += GRID_STEP) {
    gridLines.push({ type: 'h', pos: toPy(v) });
  }

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm mb-3">Graph Explorer</p>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto bg-newton-bg/[0.03] rounded-lg" role="img" aria-label="Line graph of y = mx + c">
        {gridLines.map((line, i) =>
          line.type === 'v' ? (
            <line key={`gv-${i}`} x1={line.pos} y1={PAD} x2={line.pos} y2={VIEW_H - PAD} stroke="currentColor" className="text-newton-bg/[0.06]" strokeWidth="1" />
          ) : (
            <line key={`gh-${i}`} x1={PAD} y1={line.pos} x2={VIEW_W - PAD} y2={line.pos} stroke="currentColor" className="text-newton-bg/[0.06]" strokeWidth="1" />
          )
        )}

        <line x1={PAD} y1={toPy(0)} x2={VIEW_W - PAD} y2={toPy(0)} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />
        <line x1={toPx(0)} y1={PAD} x2={toPx(0)} y2={VIEW_H - PAD} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />

        <line x1={toPx(x1)} y1={toPy(y1)} x2={toPx(x2)} y2={toPy(y2)} stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
      </svg>

      <p className="text-center text-newton-bg font-semibold text-sm mt-2">{formatEquation(slope, intercept)}</p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Slope (m): {slope}</span>
          <input
            type="range"
            min={-10}
            max={10}
            value={slope}
            onChange={(e) => setSlope(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Y-intercept (c): {intercept}</span>
          <input
            type="range"
            min={-10}
            max={10}
            value={intercept}
            onChange={(e) => setIntercept(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
      </div>
    </div>
  );
}
