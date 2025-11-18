// lib/api.ts
export function getBase() {
  // URL del backend en Render
  return (
    process.env.NEXT_PUBLIC_API_BASE ||
    "https://ethiqia-backend.onrender.com"
  );
}

// --- Helpers para el token JWT ---

const TOKEN_KEY = "ethiqia_token";

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

}
