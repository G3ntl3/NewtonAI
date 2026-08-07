'use client';

import { useState } from 'react';

const GRAVITY = 9.8; // m/s^2 — SI standard; swap to 10 here if you want the WAEC-style simplification.

function computeTrajectory(angleDeg, speed) {
  const theta = (angleDeg * Math.PI) / 180;
  const range = (speed ** 2 * Math.sin(2 * theta)) / GRAVITY;
  const maxHeight = (speed ** 2 * Math.sin(theta) ** 2) / (2 * GRAVITY);
  return { range, maxHeight, theta };
}

/** Static arc points — no air resistance, no animation, just the curve for the current angle/speed. */
function buildArcPoints(angleDeg, speed, samples = 40) {
  const { range, theta } = computeTrajectory(angleDeg, speed);
  if (!range || Number.isNaN(range)) return [];
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const x = (range * i) / samples;
    const y = x * Math.tan(theta) - (GRAVITY * x ** 2) / (2 * speed ** 2 * Math.cos(theta) ** 2);
    points.push([x, Math.max(y, 0)]);
  }
  return points;
}

/**
 * ProjectileMotion
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. Renders a static
 * parabolic arc (standard trajectory equations, no air resistance) that
 * redraws when the sliders change. No animation, no requestAnimationFrame.
 */
export default function ProjectileMotion({ angle, speed }) {
  const [angleDeg, setAngleDeg] = useState(angle);
  const [speedVal, setSpeedVal] = useState(speed);

  const { range, maxHeight } = computeTrajectory(angleDeg, speedVal);
  const points = buildArcPoints(angleDeg, speedVal);

  const VIEW_W = 300;
  const VIEW_H = 160;
  const PAD = 12;
  const scaleX = (VIEW_W - PAD * 2) / Math.max(range, 1);
  const scaleY = (VIEW_H - PAD * 2) / Math.max(maxHeight, 1);

  const path = points
    .map(([x, y], i) => {
      const px = PAD + x * scaleX;
      const py = VIEW_H - PAD - y * scaleY;
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm mb-3">Projectile Motion</p>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto bg-newton-bg/[0.03] rounded-lg" role="img" aria-label="Projectile trajectory arc">
        <line
          x1={PAD} y1={VIEW_H - PAD} x2={VIEW_W - PAD} y2={VIEW_H - PAD}
          stroke="currentColor" className="text-newton-bg/20" strokeWidth="1"
        />
        {path && (
          <path d={path} fill="none" stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        )}
      </svg>

      <div className="flex justify-between text-xs text-newton-bg/60 mt-2">
        <span>Range: {range.toFixed(1)} m</span>
        <span>Max height: {maxHeight.toFixed(1)} m</span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Angle: {angleDeg}°</span>
          <input
            type="range"
            min={0}
            max={90}
            value={angleDeg}
            onChange={(e) => setAngleDeg(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
        <label className="block">
          <span className="text-newton-bg/60 text-xs">Speed: {speedVal} m/s</span>
          <input
            type="range"
            min={1}
            max={50}
            value={speedVal}
            onChange={(e) => setSpeedVal(Number(e.target.value))}
            className="w-full accent-newton-blue-mid"
          />
        </label>
      </div>
    </div>
  );
}
