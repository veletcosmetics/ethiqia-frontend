// lib/session.ts

const STORAGE_KEY = 'ethiqia_session';

export type SessionData = {
  token: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

export function saveSession(data: SessionData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
