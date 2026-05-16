import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const AUTH_USER_KEY = 'auth_user';

function loadTokenFromStorage(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function loadUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: loadTokenFromStorage(),
  user: loadUserFromStorage(),
  setAuth: (user, token) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    set({ accessToken: token, user });
  },
  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    set({ accessToken: null, user: null });
  },
}));
