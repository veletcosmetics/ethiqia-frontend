const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://ethiqia-backend.onrender.com';
export function getBase() { return API_BASE; }

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(t: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', t);
}

export async function api(path: string, opts: RequestInit = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(`${getBase()}${path}`, { ...opts, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
