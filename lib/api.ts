// lib/api.ts

const TOKEN_KEY = 'ethiqia_token';

export function getBase() {
  // URL base de la API de Ethiqia
  // En producción puedes definir NEXT_PUBLIC_API_BASE en Render
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}
