'use client';

import { create } from 'zustand';

/**
 * Client-side mirror of the auth session.
 * HttpOnly cookies hold the real tokens; this store holds the public user for UI.
 */
export const useSessionStore = create((set) => ({
  user: null,
  // Both live on the Profile record, not the auth user, so they are fetched
  // separately (Sidebar does it once per session). null = not fetched yet;
  // '' = fetched, none set. Keeping the two distinct stops consumers from
  // re-fetching forever for a student who simply has no nickname/picture.
  nickname: null,
  pictureUrl: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  setProfileSummary: ({ nickname, pictureUrl }) => set({ nickname, pictureUrl }),

  clearSession: () => set({ user: null, nickname: null, pictureUrl: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useSessionStore;
