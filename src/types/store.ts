import type { User } from './models';

export interface AuthState {
  user: User | null;
  session: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}