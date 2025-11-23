// lib/session.ts

const SESSION_KEY = 'ethiqia_session';
const TOKEN_KEY = 'ethiqia_token';

export type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
};

export type Session = {
  user: SessionUser;
};

// Leer sesión desde localStorage
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

// Guardar sesión en localStorage
export function setSession(session: Session) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Borrar sesión
export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
}

// --- Token (por si tu API lo usa) ---

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
  } else {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}
