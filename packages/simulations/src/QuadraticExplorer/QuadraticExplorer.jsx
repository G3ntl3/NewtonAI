'use client';

import { useState } from 'react';

const X_MIN = -10;
const X_MAX = 10;
const GRID_STEP = 2;
const SAMPLES = 60;
const Y_PAD_FRACTION = 0.15;

function numToStr(v) {
  return Number.isInteger(v) ? v : Number(v.toFixed(2));
}

function formatEquation(a, b, c) {
  const parts = [];
  const aAbs = Math.abs(a);
  const aStr = aAbs === 1 ? 'x²' : `${numToStr(aAbs)}x²`;
  parts.push(a < 0 ? `-${aStr}` : aStr);

  if (b !== 0) {
    const bAbs = Math.abs(b);
    const bStr = bAbs === 1 ? 'x' : `${numToStr(bAbs)}x`;
    parts.push(b > 0 ? `+ ${bStr}` : `- ${bStr}`);
  }

  if (c !== 0) {
    parts.push(c > 0 ? `+ ${numToStr(c)}` : `- ${numToStr(Math.abs(c))}`);
  }

  return `y = ${parts.join(' ')}`;
}

/** Static curve points across the fixed x-domain — no animation, just redraw on slider change. */
function buildCurvePoints(a, b, c) {
  const points = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLES;
    const y = a * x ** 2 + b * x + c;
    points.push([x, y]);
  }
  return points;
}

/**
 * QuadraticExplorer
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. Renders a static
 * parabola y = ax^2 + bx + c on a coordinate grid, redrawing when the
 * sliders change. Quadratic only — no animation, no expression parsing.
 */
export default function QuadraticExplorer({ a, b, c }) {
  const [coeffA, setCoeffA] = useState(a);
  const [coeffB, setCoeffB] = useState(b);
  const [coeffC, setCoeffC] = useState(c);

  const VIEW_W = 300;
  const VIEW_H = 200;
  const PAD = 12;

  const points = buildCurvePoints(coeffA, coeffB, coeffC);
  const ys = points.map(([, y]) => y);
  let yMin = Math.min(...ys, 0);
  let yMax = Math.max(...ys, 0);
  const yPad = Math.max((yMax - yMin) * Y_PAD_FRACTION, 1);
  yMin -= yPad;
  yMax += yPad;

  const scaleX = (VIEW_W - PAD * 2) / (X_MAX - X_MIN);
  const scaleY = (VIEW_H - PAD * 2) / (yMax - yMin);

  const toPx = (x) => PAD + (x - X_MIN) * scaleX;
  const toPy = (y) => VIEW_H - PAD - (y - yMin) * scaleY;

  const gridLinesV = [];
  for (let v = X_MIN; v <= X_MAX; v += GRID_STEP) {
    gridLinesV.push(toPx(v));
  }

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${toPx(x).toFixed(1)},${toPy(y).toFixed(1)}`)
    .join(' ');

  const vertexX = coeffA !== 0 ? -coeffB / (2 * coeffA) : 0;
  const vertexY = coeffA * vertexX ** 2 + coeffB * vertexX + coeffC;
  const vertexInView = vertexX >= X_MIN && vertexX <= X_MAX;

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm mb-3">Quadratic Explorer</p>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto bg-newton-bg/[0.03] rounded-lg" role="img" aria-label="Parabola graph of y = ax^2 + bx + c">
        {gridLinesV.map((pos, i) => (
          <line key={`gv-${i}`} x1={pos} y1={PAD} x2={pos} y2={VIEW_H - PAD} stroke="currentColor" className="text-newton-bg/[0.06]" strokeWidth="1" />
        ))}

        {yMin <= 0 && yMax >= 0 && (
          <line x1={PAD} y1={toPy(0)} x2={VIEW_W - PAD} y2={toPy(0)} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />
        )}
        <line x1={toPx(0)} y1={PAD} x2={toPx(0)} y2={VIEW_H - PAD} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />

        <path d={path} fill="none" stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />

        {vertexInView && (
          <circle cx={toPx(vertexX)} cy={toPy(vertexY)} r="3" fill="currentColor" className="text-newton-blue-mid" />
        )}
      </svg>

      <p className="text-center text-newton-bg font-semibold text-sm mt-2">{formatEquation(coeffA, coeffB, coeffC)}</p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-newton-bg/60 text-xs">a: {numToStr(coeffA)}</span>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={coeffA}
            onChange={(e) => setCoeffA(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">b: {numToStr(coeffB)}</span>
          <input
            type="range"
            min={-10}
            max={10}
            value={coeffB}
            onChange={(e) => setCoeffB(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">c: {numToStr(coeffC)}</span>
          <input
            type="range"
            min={-10}
            max={10}
            value={coeffC}
            onChange={(e) => setCoeffC(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
      </div>
    </div>
  );
}
