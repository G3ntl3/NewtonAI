'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchFlashcards } from '@/lib/flashcardApi';
import {
  XIcon,
  PencilIcon,
  MoreVerticalIcon,
  LightbulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CardsIcon,
  SUBJECT_ICON_MAP,
  BookIcon,
} from '@/components/dashboard/icons';

// Small rotating set of generic study-technique tips — display copy only,
// not attributed to any specific card's content.
const TIPS = [
  'Say it out loud first — that is what makes it stick.',
  'Try explaining this to someone else in your own words.',
  'Write it down from memory, then check what you missed.',
  'Come back to this one tomorrow — spaced review beats cramming.',
];

/**
 * flashcards page — one-at-a-time flashcard viewer (tap to reveal).
 * ?start=<flashcardId> opens at that card (used by the profile page's
 * per-topic "Saved" list); otherwise starts at the first card.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <FlashcardViewer />
    </Suspense>
  );
}

function FlashcardViewer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFlashcards().then(({ ok, data }) => {
      if (cancelled) return;
      if (ok) {
        const list = data.data;
        setCards(list);
        const startId = searchParams.get('start');
        const startIndex = startId ? list.findIndex((c) => c.id === startId) : 0;
        setIndex(startIndex >= 0 ? startIndex : 0);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(nextIndex) {
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    setIndex(nextIndex);
    setRevealed(false);
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-full border-2 border-newton-blue-mid border-t-transparent animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="px-4 md:px-8 py-6 text-center">
        <p className="text-newton-bg/50 text-sm">No flashcards yet — save one from a chat with Newton.</p>
        <button
          type="button"
          onClick={() => router.push('/chat')}
          className="mt-3 text-newton-blue-mid text-sm font-semibold"
        >
          Go to Chat
        </button>
      </div>
    );
  }

  const card = cards[index];
  const SubjectIcon = (card.subject && SUBJECT_ICON_MAP[card.subject.icon]) || BookIcon;
  const reviewLabel = card.seenCount === 0 ? 'Never reviewed' : `Reviewed ${card.seenCount} time${card.seenCount === 1 ? '' : 's'}`;

  return (
    <div className="animate-fade-in px-4 md:px-8 py-4 md:py-6 max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          aria-label="Close"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-newton-bg/[0.06] transition-colors"
        >
          <XIcon className="w-4 h-4 text-newton-bg" />
        </button>
        <div className="text-center">
          <p className="text-newton-bg font-bold text-sm leading-tight">Flashcard</p>
          <p className="text-newton-bg/45 text-xs">{index + 1} of {cards.length}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Edit"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-newton-bg/[0.06] transition-colors"
          >
            <PencilIcon className="w-4 h-4 text-newton-bg/60" />
          </button>
          <button
            type="button"
            aria-label="More"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-newton-bg/[0.06] transition-colors"
          >
            <MoreVerticalIcon className="w-4 h-4 text-newton-bg/60" />
          </button>
        </div>
      </div>

      <div className="bg-newton-bg rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <SubjectIcon className="w-4 h-4 text-white/80" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-[11px] uppercase tracking-wide truncate">
              {card.subject?.name ?? 'General'}
            </p>
            <p className="text-white/40 text-[11px] truncate">Added by you · {reviewLabel}</p>
          </div>
        </div>

        <p className="text-white font-semibold text-lg leading-snug mb-4">{card.question}</p>

        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="w-full bg-white rounded-xl px-4 py-4 flex flex-col items-center gap-1.5 hover:bg-white/95 transition-colors"
          >
            <LightbulbIcon className="w-4 h-4 text-newton-blue-mid" />
            <span className="text-newton-bg/50 text-sm font-medium">Tap To Reveal</span>
          </button>
        ) : (
          <div className="bg-white rounded-xl px-4 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <LightbulbIcon className="w-4 h-4 text-newton-green" />
              <span className="text-newton-green text-xs font-bold">Answer</span>
            </div>
            <p className="text-newton-bg text-sm leading-relaxed">
              {card.answer || 'No answer was added for this card yet.'}
            </p>
          </div>
        )}

        <p className="text-white/40 text-xs text-center mt-4">{TIPS[index % TIPS.length]}</p>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous flashcard"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-newton-bg/[0.06] disabled:opacity-30 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 text-newton-bg/60" />
        </button>
        <p className="text-newton-bg/50 text-xs font-medium flex items-center gap-1.5">
          <CardsIcon className="w-3.5 h-3.5" />
          Flashcard {index + 1} of {cards.length}
        </p>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1}
          aria-label="Next flashcard"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-newton-bg/[0.06] disabled:opacity-30 transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4 text-newton-bg/60" />
        </button>
      </div>
    </div>
  );
}
