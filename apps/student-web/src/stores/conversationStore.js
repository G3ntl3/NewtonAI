'use client';

import { create } from 'zustand';

/**
 * Active Socratic tutoring conversation — message history and streaming
 * state for the chat page. `messages` mixes student turns (plain text) and
 * tutor turns (validated Learning Blocks from the AI).
 */
export const useConversationStore = create((set) => ({
  subject: null,
  concept: null, // { title, objective } | null — from the last session fetch; not live-updated mid-chat
  messages: [], // [{ role: 'student', text }] | [{ role: 'tutor', blocks }]
  isStreaming: false,
  error: '',

  setSubject: (subject) => set({ subject }),

  setConcept: (concept) => set({ concept }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  // Hydrates from a saved session's history. Tutor turns carry their full
  // saved `blocks` array (route.js now persists it) so a refresh shows
  // exactly what the student saw, including any simulation/quiz/
  // subjectSwitch block — not just the chat text. Older entries saved
  // before `blocks` existed won't have it; fall back to a single synthetic
  // chat block from `text` for those.
  setHistory: (history) =>
    set({
      messages: (history ?? []).map((turn) =>
        turn.role === 'student'
          ? { role: 'student', text: turn.text }
          : { role: 'tutor', blocks: turn.blocks?.length ? turn.blocks : [{ type: 'chat', payload: { text: turn.text } }] }
      ),
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setError: (error) => set({ error }),

  reset: () => set({ subject: null, concept: null, messages: [], isStreaming: false, error: '' }),
}));

export default useConversationStore;
