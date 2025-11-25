// lib/notifications.ts

const STORAGE_KEY = 'ethiqia_notifications';

export type EthiqiaNotificationType =
  | 'post-scored'
  | 'comment-approved'
  | 'comment-blocked';

export type EthiqiaNotification = {
  id: string;
  type: EthiqiaNotificationType;
  message: string;
  created_at: string; // ISO date
  read: boolean;
};

function loadRaw(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EthiqiaNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveRaw(list: EthiqiaNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignoramos errores de almacenamiento
  }
}

/**
 * Devuelve todas las notificaciones, ordenadas de la más reciente a la más antigua.
 */
export function getNotifications(): EthiqiaNotification[] {
  const list = loadRaw();
  return [...list].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Añade una nueva notificación local.
 *
 * Ejemplos:
 *  - addNotification('post-scored', 'Tu publicación generó 87 puntos de Ethiqia Score.')
 *  - addNotification('comment-approved', 'Tu comentario fue publicado correctamente.')
 *  - addNotification('comment-blocked', 'Tu comentario fue bloqueado y pierdes 0,8 puntos de Ethiqia Score.')
 */
export function addNotification(
  type: EthiqiaNotificationType,
  message: string
) {
  const now = new Date().toISOString();
  const list = loadRaw();

  const notif: EthiqiaNotification = {
    id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    created_at: now,
    read: false,
  };

  const updated = [notif, ...list].slice(0, 100); // máx. 100
  saveRaw(updated);
}

/**
 * Marca todas las notificaciones como leídas.
 */
export function markAllAsRead() {
  const list = loadRaw();
  const updated = list.map((n) => ({ ...n, read: true }));
  saveRaw(updated);
}

/**
 * Borra todas las notificaciones (por si algún día lo quieres usar).
 */
export function clearNotifications() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignoramos
  }
}
