/**
 * Auth Store — Zustand
 *
 * Manages authentication state globally.
 * JWT is stored in memory (not localStorage) for security.
 * Uses zustand persist middleware to survive page refresh via sessionStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'owner' | 'builder' | 'municipal' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'urbancore-auth',
      storage: createJSONStorage(() => sessionStorage),  // sessionStorage — cleared on tab close
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
