'use client';

import { BookmarkIcon, CardsIcon } from '@/components/dashboard/icons';

/**
 * TurnActionsMenu
 * Popup opened by the "+" button attached to a tutor turn (once per turn,
 * not per block — see chat/page.jsx). Two real actions: Bookmark Chat
 * (POST /api/bookmarks) and Add To Flashcard (opens AddFlashcardModal).
 */
export default function TurnActionsMenu({ onClose, onBookmark, onAddFlashcard }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 bottom-9 right-0 w-52 bg-newton-bg rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <button
          type="button"
          onClick={onBookmark}
          className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/5 transition-colors border-b border-white/10"
        >
          <BookmarkIcon className="w-4 h-4 text-white/70" />
          Bookmark Chat
        </button>
        <button
          type="button"
          onClick={onAddFlashcard}
          className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm hover:bg-white/5 transition-colors"
        >
          <CardsIcon className="w-4 h-4 text-white/70" />
          Add To Flashcard
        </button>
      </div>
    </>
  );
}
