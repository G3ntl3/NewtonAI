'use client';

import { useState } from 'react';
import { CardsIcon } from '@/components/dashboard/icons';

/**
 * AddFlashcardModal
 * Opens blank (matching the mockup — no prefill from the tutor's message).
 * onSave receives { question, answer } and is expected to call
 * createFlashcard() and close this on success.
 */
export default function AddFlashcardModal({ onClose, onSave, saving }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 bg-newton-bg/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-newton-bg rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <CardsIcon className="w-4 h-4 text-white/70" />
          <p className="text-white font-semibold text-sm">Add New Flashcard</p>
        </div>

        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type Your Flashcard Title Here"
          className="w-full px-4 py-3 rounded-xl bg-white text-newton-bg text-sm placeholder:text-newton-bg/35 outline-none mb-3"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type Your Main Flashcard Body Here"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white text-newton-bg text-sm placeholder:text-newton-bg/35 outline-none mb-4 resize-none"
        />

        <button
          type="button"
          onClick={() => onSave({ question: question.trim(), answer: answer.trim() })}
          disabled={!question.trim() || saving}
          className="w-full py-3 rounded-full bg-white text-newton-bg font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Flashcard'}
        </button>
      </div>
    </div>
  );
}
