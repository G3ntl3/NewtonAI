'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

// Splits chat text into plain-text and math segments. The model routinely
// writes inline LaTeX in prose ("solve $2x + 5 = 2$ for $x$"); without this
// the delimiters render literally as dollar signs.
const MATH_SPLIT = /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g;

function parseSegments(text) {
  return text
    .split(MATH_SPLIT)
    .filter(Boolean)
    .map((part) => {
      const isDisplay = part.startsWith('$$') && part.endsWith('$$') && part.length > 4;
      const isInline = !isDisplay && part.startsWith('$') && part.endsWith('$') && part.length > 2;
      if (!isDisplay && !isInline) return { type: 'text', value: part };

      const value = isDisplay ? part.slice(2, -2) : part.slice(1, -1);
      // Guard against prices ("$5 and $10"): real math never opens or closes
      // on whitespace, so anything that does is treated as ordinary text.
      if (!/^\S/.test(value) || !/\S$/.test(value)) return { type: 'text', value: part };
      return { type: 'math', value, displayMode: isDisplay };
    });
}

/**
 * Renders chat prose with inline LaTeX typeset by KaTeX. KaTeX (JS + CSS) is
 * dynamically imported only when a message actually contains math — same
 * lazy pattern as FormulaBlock — so plain messages don't pay for it.
 *
 * Math must NEVER crash or blank a message: until KaTeX loads, and if it
 * fails to load or the LaTeX is malformed, the segment falls back to its
 * raw content with the delimiters stripped, which stays readable.
 */
function RichText({ text }) {
  const segments = useMemo(() => parseSegments(text), [text]);
  const hasMath = segments.some((s) => s.type === 'math');
  const [katex, setKatex] = useState(null);

  useEffect(() => {
    if (!hasMath) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const [katexModule] = await Promise.all([
          import('katex'),
          import('katex/dist/katex.min.css'),
        ]);
        if (!cancelled) setKatex(() => katexModule.default ?? katexModule);
      } catch {
        // Leave katex null — segments fall back to readable plain text.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasMath]);

  return segments.map((segment, i) => {
    if (segment.type === 'text') return <span key={i}>{segment.value}</span>;
    if (!katex) return <span key={i}>{segment.value}</span>;

    try {
      const html = katex.renderToString(segment.value, {
        throwOnError: true,
        displayMode: segment.displayMode,
      });
      // KaTeX output only; `trust` defaults to false so no raw HTML passes through.
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span key={i}>{segment.value}</span>;
    }
  });
}

/**
 * ChatBlock
 * Renders the 'chat' Learning Block type — Newton's spoken turn.
 *
 * `onSave` (optional) turns the corner "+" into the real save affordance
 * (bookmark / add flashcard). Without it the "+" stays decorative, which is
 * what non-chat surfaces reusing this block get.
 */
export default function ChatBlock({ payload, onSave, isSaveOpen = false }) {
  return (
    <div className="relative bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 pr-8 max-w-[85%]">
      <p className="text-newton-bg text-sm leading-relaxed whitespace-pre-wrap">
        <RichText text={payload.text} />
      </p>
      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          aria-label="Save this response"
          aria-expanded={isSaveOpen}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-newton-bg/30 hover:text-newton-bg/70 hover:bg-newton-bg/[0.05] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      ) : (
        <Plus className="absolute bottom-2 right-2 w-3.5 h-3.5 text-newton-bg/20" aria-hidden="true" />
      )}
    </div>
  );
}
