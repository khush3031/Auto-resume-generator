import { create } from 'zustand';
import * as api from '../lib/api';

export type UserProfile = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  isEmailVerified: boolean;
};

type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
};

const storageKey = 'resumeforge-auth';

function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  } catch {
    return null;
  }
}

function clearStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey);
  document.cookie = 'accessToken=; path=/; max-age=0; samesite=lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; samesite=lax';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.login(email, password);
      window.localStorage.setItem(storageKey, JSON.stringify({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.register(fullName, email, password);
      window.localStorage.setItem(storageKey, JSON.stringify({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.logout();
    } finally {
      clearStorage();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  refreshTokens: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.refreshTokens();
      window.localStorage.setItem(storageKey, JSON.stringify({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearStorage();
      set({ user: null, isAuthenticated: false, isLoading: false, error: (error as Error).message });
      throw error;
    }
  },
  loadFromStorage: async () => {
    set({ isLoading: true, error: null });
    const tokens = getStoredTokens();
    if (!tokens) {
      set({ isLoading: false });
      return;
    }
    try {
      const profile = await api.fetchMe();
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      clearStorage();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  }
}));
