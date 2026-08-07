'use client';

import { create } from 'zustand';

/**
 * Client-side mirror of the auth session.
 * HttpOnly cookies hold the real tokens; this store holds the public user for UI.
 */
export const useSessionStore = create((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  clearSession: () => set({ user: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useSessionStore;
