'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { phAt, equivalenceVolumeMl } from './chemistry.js';

const BURETTE_CAPACITY_ML = 50;
const POUR_TICK_MS = 60;
const POUR_STEP_ML = 0.05; // ~0.8 mL/s while held
const FINE_STEP_ML = 0.1; // the "one drop decides it" control near the endpoint

const CURVE_W = 300;
const CURVE_H = 120;
const CURVE_PAD = 22;

/** Standard school practical: a rough run to find the range, then 3 accurate ones. */
const TRIAL_LABELS = ['Rough', '1st', '2nd', '3rd'];

/**
 * Mean titre. The ROUGH run is deliberately excluded — it exists only to
 * locate the endpoint approximately, and including it would drag the average
 * away from the accurate runs. This mirrors how the practical is actually
 * marked.
 */
export function averageTitre(readings) {
  const accurate = readings.slice(1).filter((v) => typeof v === 'number');
  if (accurate.length === 0) return null;
  return accurate.reduce((a, b) => a + b, 0) / accurate.length;
}

function fmt(v, dp = 2) {
  return v.toFixed(dp);
}

/** Plain-language pH descriptor, for the live readout. */
function describePh(ph) {
  if (ph < 3) return 'strongly acidic';
  if (ph < 6.5) return 'weakly acidic';
  if (ph <= 7.5) return 'neutral';
  if (ph < 11) return 'weakly alkaline';
  return 'strongly alkaline';
}

/**
 * Titration
 * Trusted, pre-built simulation component — only ever receives params after
 * SimulationBlock has validated them against paramSchema. All pH values come
 * from ./chemistry.js, which is verified independently; nothing here does
 * chemistry of its own.
 *
 * Hold-to-pour is a simple timer that increments the added volume while the
 * button is held — deliberately not a fluid simulation.
 */
export default function Titration({
  acidConcentration,
  acidVolumeMl,
  baseConcentration,
  ka,
  endpointPh,
}) {
  const params = useMemo(
    () => ({ acidConcentration, acidVolumeMl, baseConcentration, ka }),
    [acidConcentration, acidVolumeMl, baseConcentration, ka]
  );

  const [volume, setVolume] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [readings, setReadings] = useState([null, null, null, null]);
  const timerRef = useRef(null);

  const ph = phAt({ ...params, baseVolumeMl: volume });
  const pastEndpoint = ph >= endpointPh;
  const equivalence = equivalenceVolumeMl(params);

  const addVolume = useCallback((delta) => {
    setVolume((v) => Math.min(BURETTE_CAPACITY_ML, Math.round((v + delta) * 100) / 100));
  }, []);

  const stopPour = useCallback(() => {
    setPouring(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPour = useCallback(() => {
    if (timerRef.current) return;
    setPouring(true);
    timerRef.current = setInterval(() => addVolume(POUR_STEP_ML), POUR_TICK_MS);
  }, [addVolume]);

  // Stop the timer if the component unmounts mid-pour.
  useEffect(() => stopPour, [stopPour]);

  // Stop pouring once the burette is empty.
  useEffect(() => {
    if (volume >= BURETTE_CAPACITY_ML) stopPour();
  }, [volume, stopPour]);

  // The trace drawn so far — recomputed from the verified chemistry, not
  // accumulated, so it is always consistent with the current parameters.
  const tracePath = useMemo(() => {
    if (volume <= 0) return '';
    const steps = 120;
    const toX = (v) => CURVE_PAD + (v / BURETTE_CAPACITY_ML) * (CURVE_W - CURVE_PAD - 8);
    const toY = (p) => CURVE_H - CURVE_PAD - (p / 14) * (CURVE_H - CURVE_PAD - 8);
    let d = '';
    for (let i = 0; i <= steps; i += 1) {
      const v = (volume * i) / steps;
      const p = phAt({ ...params, baseVolumeMl: v });
      d += `${i === 0 ? 'M' : 'L'}${toX(v).toFixed(1)},${toY(p).toFixed(1)}`;
    }
    return d;
  }, [params, volume]);

  const toX = (v) => CURVE_PAD + (v / BURETTE_CAPACITY_ML) * (CURVE_W - CURVE_PAD - 8);
  const toY = (p) => CURVE_H - CURVE_PAD - (p / 14) * (CURVE_H - CURVE_PAD - 8);

  const remaining = BURETTE_CAPACITY_ML - volume;
  const fillFrac = remaining / BURETTE_CAPACITY_ML;

  // First empty slot; -1 once all four trials are recorded.
  const nextTrialIndex = readings.findIndex((r) => r == null);
  const average = averageTitre(readings);

  /** Log the current burette reading into the next free trial, then start a fresh run. */
  const recordReading = useCallback(() => {
    stopPour();
    setReadings((prev) => {
      const idx = prev.findIndex((r) => r == null);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = volume;
      return next;
    });
    setVolume(0);
  }, [volume, stopPour]);

  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
      <p className="text-newton-bg font-semibold text-sm">Acid-Base Titration</p>
      <p className="text-newton-blue-mid text-xs font-medium mt-0.5 mb-3">
        {fmt(baseConcentration, 3)} M base into {fmt(acidVolumeMl, 1)} mL of{' '}
        {fmt(acidConcentration, 3)} M {ka == null ? 'strong acid' : 'weak acid'}
      </p>

      {/* Apparatus */}
      <svg viewBox="0 0 300 150" className="w-full h-auto bg-newton-bg/[0.03] rounded-lg" role="img"
        aria-label={`Burette with ${fmt(remaining, 2)} mL remaining; flask at pH ${fmt(ph)}`}>
        {/* Burette */}
        <text x="58" y="14" textAnchor="middle" className="fill-newton-bg/45" fontSize="8">burette</text>
        <rect x="48" y="20" width="20" height="96" rx="3" fill="none" stroke="currentColor" className="text-newton-bg/25" strokeWidth="1.5" />
        <rect
          x="49.5" y={21.5 + (1 - fillFrac) * 93} width="17" height={Math.max(fillFrac * 93, 0)}
          className="fill-newton-cyan/70"
        />
        <rect x="52" y="118" width="12" height="6" rx="1" className="fill-newton-bg/40" />
        <text x="58" y="138" textAnchor="middle" className="fill-newton-bg/50" fontSize="8">
          {fmt(remaining, 2)} mL left
        </text>

        {/* Conical flask */}
        <path d="M188 34 L188 58 L166 108 Q164 116 172 116 L232 116 Q240 116 238 108 L216 58 L216 34 Z"
          fill="none" stroke="currentColor" className="text-newton-bg/30" strokeWidth="1.5" />
        {/* Solution — turns pink once the indicator has changed */}
        <path d="M171 92 L169.5 108 Q168.5 113 174 113 L230 113 Q235.5 113 234.5 108 L233 92 Z"
          className={pastEndpoint ? 'fill-pink-400/70' : 'fill-newton-cyan/25'} />

        {/* Readouts */}
        <rect x="86" y="46" width="66" height="34" rx="5" className="fill-newton-bg" />
        <text x="119" y="58" textAnchor="middle" className="fill-white/60" fontSize="7">ADDED</text>
        <text x="119" y="72" textAnchor="middle" className="fill-white font-bold" fontSize="14">{fmt(volume)}</text>

        <rect x="86" y="86" width="66" height="34" rx="5" className="fill-newton-cyan/15" />
        <text x="119" y="98" textAnchor="middle" className="fill-newton-bg/50" fontSize="7">pH</text>
        <text x="119" y="112" textAnchor="middle" className="fill-newton-bg font-bold" fontSize="14">{fmt(ph)}</text>
      </svg>

      <p className="text-center text-newton-bg/60 text-[11px] mt-1.5">
        {describePh(ph)}
        {pastEndpoint && <span className="text-pink-500 font-semibold"> · endpoint reached</span>}
      </p>

      {/* Live pH curve */}
      <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} className="w-full h-auto bg-newton-bg/[0.03] rounded-lg mt-3"
        role="img" aria-label="pH against volume of titrant added">
        <text x={CURVE_PAD} y="12" className="fill-newton-bg/45" fontSize="8">TITRATION CURVE</text>
        <text x={CURVE_W - 8} y="12" textAnchor="end" className="fill-newton-bg/35" fontSize="8">pH vs volume</text>

        {/* Axes */}
        <line x1={CURVE_PAD} y1={toY(0)} x2={CURVE_W - 8} y2={toY(0)} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />
        <line x1={CURVE_PAD} y1={toY(14)} x2={CURVE_PAD} y2={toY(0)} stroke="currentColor" className="text-newton-bg/20" strokeWidth="1" />
        <text x={CURVE_PAD - 4} y={toY(14) + 3} textAnchor="end" className="fill-newton-bg/40" fontSize="7">14</text>
        <text x={CURVE_PAD - 4} y={toY(7) + 3} textAnchor="end" className="fill-newton-bg/40" fontSize="7">7</text>
        <text x={CURVE_PAD - 4} y={toY(0) + 3} textAnchor="end" className="fill-newton-bg/40" fontSize="7">0</text>
        <text x={CURVE_W - 8} y={toY(0) + 10} textAnchor="end" className="fill-newton-bg/35" fontSize="7">{BURETTE_CAPACITY_ML} mL</text>

        {/* Indicator endpoint */}
        <line x1={CURVE_PAD} y1={toY(endpointPh)} x2={CURVE_W - 8} y2={toY(endpointPh)}
          stroke="currentColor" className="text-pink-400/70" strokeWidth="1" strokeDasharray="3 3" />
        <text x={CURVE_W - 10} y={toY(endpointPh) - 3} textAnchor="end" className="fill-pink-400" fontSize="7">
          endpoint pH {fmt(endpointPh, 1)}
        </text>

        {/* Trace so far */}
        {tracePath && (
          <path d={tracePath} fill="none" stroke="currentColor" className="text-newton-blue-mid" strokeWidth="2" />
        )}
        {/* Current position */}
        <circle cx={toX(volume)} cy={toY(ph)} r="3" className="fill-newton-blue-mid" />
      </svg>

      {/* Controls */}
      <button
        type="button"
        onPointerDown={startPour}
        onPointerUp={stopPour}
        onPointerLeave={stopPour}
        onPointerCancel={stopPour}
        disabled={volume >= BURETTE_CAPACITY_ML}
        className={`w-full mt-3 py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 ${
          pouring ? 'bg-newton-blue-bright' : 'bg-newton-blue-mid hover:bg-newton-blue-bright'
        }`}
      >
        {pouring ? 'Pouring…' : 'Hold to pour'}
      </button>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => addVolume(FINE_STEP_ML)}
          disabled={volume >= BURETTE_CAPACITY_ML}
          className="flex-1 py-2 rounded-xl border border-newton-bg/15 text-newton-bg/75 hover:bg-newton-bg/[0.04] disabled:opacity-40 text-xs font-semibold transition-colors"
        >
          + {FINE_STEP_ML.toFixed(2)} mL
        </button>
        <button
          type="button"
          onClick={recordReading}
          disabled={volume <= 0 || nextTrialIndex === -1}
          className="flex-1 py-2 rounded-xl border border-newton-bg/15 text-newton-bg/75 hover:bg-newton-bg/[0.04] disabled:opacity-40 text-xs font-semibold transition-colors"
        >
          Record
        </button>
        <button
          type="button"
          onClick={() => { stopPour(); setVolume(0); }}
          title="Empty the flask and refill the burette for the next trial"
          className="px-3 py-2 rounded-xl border border-newton-bg/15 text-newton-bg/75 hover:bg-newton-bg/[0.04] text-xs font-semibold transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Readings table */}
      <div className="mt-4 bg-newton-bg/[0.03] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-newton-bg font-semibold text-xs">Your readings</p>
          <p className="text-newton-bg/40 text-[10px]">titre / mL</p>
        </div>

        <div className="space-y-1.5">
          {TRIAL_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`text-[11px] w-10 shrink-0 ${readings[i] == null ? 'text-newton-bg/35' : 'text-newton-bg/70 font-medium'}`}>
                {label}
              </span>
              <div className="flex-1 h-1.5 bg-newton-bg/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-newton-blue-mid transition-all"
                  style={{ width: readings[i] == null ? '0%' : `${Math.min(100, (readings[i] / BURETTE_CAPACITY_ML) * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] w-12 text-right shrink-0 ${readings[i] == null ? 'text-newton-bg/30' : 'text-newton-bg font-semibold'}`}>
                {readings[i] == null ? '—' : fmt(readings[i])}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-newton-bg/[0.08]">
          <span className="text-newton-bg font-semibold text-xs">Average titre</span>
          <span className="text-newton-blue-mid font-bold text-xs">
            {average == null ? '— mL' : `${fmt(average)} mL`}
          </span>
        </div>
        <p className="text-newton-bg/40 text-[10px] mt-1">
          Averaged over the accurate runs only — the rough run is excluded.
        </p>
      </div>

      <p className="text-newton-bg/45 text-[11px] mt-3 leading-relaxed">
        Hold to run titrant in. Near the endpoint switch to the {FINE_STEP_ML.toFixed(2)} mL
        button — one drop decides it. Record each titre, then Reset for the next trial.
        Equivalence is at {fmt(equivalence)} mL.
      </p>
    </div>
  );
}
