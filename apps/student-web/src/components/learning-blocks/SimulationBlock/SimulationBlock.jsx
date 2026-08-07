import { registry } from '@newton/simulations/src/registry.js';

/**
 * SimulationBlock
 * Renders the 'simulation' Learning Block type. The AI selects a
 * simulationId + params; this looks the id up in the trusted registry and
 * validates params against that sim's own paramSchema — the second
 * validation layer, beyond the generic shape check already done in
 * packages/types/src/conversation.js — before rendering the pre-built
 * component. Never renders AI-generated code. Unknown ids or invalid
 * params render a graceful fallback, not a crash and not a silent null.
 */
export default function SimulationBlock({ payload }) {
  const entry = registry[payload.simulationId];
  if (!entry) {
    return <SimulationFallback />;
  }

  const parsed = entry.paramSchema.safeParse(payload.params);
  if (!parsed.success) {
    return <SimulationFallback />;
  }

  const { Component } = entry;
  return <Component {...parsed.data} />;
}

function SimulationFallback() {
  return (
    <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl px-4 py-3 w-full max-w-sm mx-auto">
      <p className="text-newton-bg/50 text-sm">This simulation couldn't load.</p>
    </div>
  );
}
