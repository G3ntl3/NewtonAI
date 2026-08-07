'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLabCatalog } from '@/lib/labCatalog';
import { ArrowLeftIcon } from '@/components/dashboard/icons';
import SimulationBlock from '@/components/learning-blocks/SimulationBlock';
import FormulaBlock from '@/components/learning-blocks/FormulaBlock';

/**
 * Lab experiment detail page — opens a live sim full-screen (no modal),
 * matching the rest of the app's page-based navigation. Reuses
 * SimulationBlock/registry exactly as chat does (same validate-then-render
 * pipeline, no new sim-rendering logic) so sliders already update live —
 * that's the sim component's own local state, unchanged here. The formula
 * card underneath reuses FormulaBlock/KaTeX, the same block chat uses.
 *
 * Sandbox only — no guided steps, no objectives wrapper. That's a separate
 * future task.
 */
export default function Page() {
  const { simulationId } = useParams();
  const router = useRouter();
  const catalog = useMemo(() => getLabCatalog(), []);
  const experiment = catalog.find((e) => e.simulationId === simulationId && e.available);

  if (!experiment) {
    return (
      <div className="px-4 md:px-8 py-6">
        <p className="text-newton-bg/50 text-sm">This experiment isn't available.</p>
        <button
          type="button"
          onClick={() => router.push('/lab')}
          className="mt-3 text-newton-blue-mid text-sm font-semibold"
        >
          Back to Lab
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="bg-newton-bg px-4 md:px-8 pt-4 md:pt-6 pb-4 flex items-center gap-3 rounded-b-3xl">
        <button
          type="button"
          onClick={() => router.push('/lab')}
          aria-label="Back to Lab"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-white" />
        </button>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight truncate">{experiment.title}</h1>
          {experiment.subtitle && (
            <p className="text-white/50 text-xs mt-0.5 truncate">{experiment.subtitle}</p>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 md:py-6 space-y-4">
        <SimulationBlock payload={{ simulationId: experiment.simulationId, params: {}, objectives: [] }} />

        {experiment.formula && (
          <FormulaBlock payload={{ latex: experiment.formula.latex, caption: experiment.formula.caption }} />
        )}

        {experiment.variables.length > 0 && (
          <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4 w-full max-w-sm mx-auto">
            <p className="text-newton-bg font-semibold text-sm mb-3">Where</p>
            <dl className="space-y-2">
              {experiment.variables.map(({ symbol, meaning }) => (
                <div key={symbol} className="flex items-start gap-2 text-xs">
                  <dt className="text-newton-blue-mid font-semibold shrink-0 w-6">{symbol}</dt>
                  <dd className="text-newton-bg/60">= {meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
