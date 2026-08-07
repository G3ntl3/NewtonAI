'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * FormulaBlock
 * Renders the 'formula' Learning Block type as a styled formula card,
 * typeset via KaTeX. KaTeX (JS + CSS) is dynamically imported inside the
 * effect below — never a top-level import — so it only enters the bundle
 * when a formula block actually renders, keeping the chat's initial load
 * small for low-bandwidth students.
 *
 * Malformed LaTeX must NEVER crash the message: if KaTeX throws, this
 * falls back to the raw latex string as plain text (same defensive pattern
 * as SimulationBlock's fallback). This does not change reveal-ladder
 * pedagogy at all — it only changes how an already-permitted formula is
 * presented.
 */
export default function FormulaBlock({ payload }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    async function renderFormula() {
      try {
        const [katexModule] = await Promise.all([
          import('katex'),
          import('katex/dist/katex.min.css'),
        ]);
        const katex = katexModule.default ?? katexModule;
        if (cancelled || !containerRef.current) return;
        katex.render(payload.latex, containerRef.current, {
          throwOnError: true,
          displayMode: true,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    renderFormula();
    return () => {
      cancelled = true;
    };
  }, [payload.latex]);

  return (
    <div className="bg-newton-navy rounded-2xl px-5 py-4 max-w-sm w-fit mx-auto">
      {payload.caption && (
        <p className="text-newton-cyan-lighter text-xs font-medium mb-2 text-center">{payload.caption}</p>
      )}
      {failed ? (
        <p className="text-newton-cyan-ghost text-sm text-center font-mono">{payload.latex}</p>
      ) : (
        <div ref={containerRef} className="text-newton-cyan-ghost text-center overflow-x-auto" />
      )}
    </div>
  );
}
