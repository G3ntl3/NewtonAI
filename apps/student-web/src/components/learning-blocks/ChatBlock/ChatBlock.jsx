import { Plus } from 'lucide-react';

/**
 * ChatBlock
 * Renders the 'chat' Learning Block type — Newton's spoken turn.
 */
export default function ChatBlock({ payload }) {
  return (
    <div className="relative bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 pr-8 max-w-[85%]">
      <p className="text-newton-bg text-sm leading-relaxed whitespace-pre-wrap">
        {payload.text}
      </p>
      {/* Decorative only — no "save/expand" feature exists yet. */}
      <Plus className="absolute bottom-2 right-2 w-3.5 h-3.5 text-newton-bg/20" aria-hidden="true" />
    </div>
  );
}
