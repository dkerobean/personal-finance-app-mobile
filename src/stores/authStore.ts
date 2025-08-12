import { create } from 'zustand';
import type { AuthState, AuthActions } from '@/types/store';

interface AuthStore extends AuthState, AuthActions {}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),

  setSession: (session) =>
    set((state) => ({
      session,
      isAuthenticated: !!session,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    }),
}));