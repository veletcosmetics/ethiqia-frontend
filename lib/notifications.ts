// lib/notifications.ts

const STORAGE_KEY = 'ethiqia_notifications_v1';

export type EthiqiaNotificationType =
  | 'post-scored'
  | 'comment-approved'
  | 'comment-blocked';

export type EthiqiaNotification = {
  id: string;
  type: EthiqiaNotificationType;
  message: string;
  createdAt: number;
  read: boolean;
};

// ---- utilidades internas ----
function loadFromStorage(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EthiqiaNotification[];
    if (!Array.isArray(parsed)) return [];
    // ordenar de más reciente a más antiguo
    return parsed
      .filter((n) => !!n && typeof n.id === 'string')
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveToStorage(notifs: EthiqiaNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch {
    // si falla, no rompemos la app
    console.warn('No se pudieron guardar las notificaciones en localStorage');
  }
}

// ---- API pública ----

/**
 * Devuelve todas las notificaciones guardadas en localStorage,
 * ordenadas de más recientes a más antiguas.
 */
export function getNotifications(): EthiqiaNotification[] {
  return loadFromStorage();
}

/**
 * Añade una nueva notificación al listado local.
 */
export function addNotification(
  type: EthiqiaNotificationType,
  message: string
) {
  const base: EthiqiaNotification = {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    createdAt: Date.now(),
    read: false,
  };

  if (typeof window === 'undefined') {
    return;
  }

  const current = loadFromStorage();
  const updated = [base, ...current];
  saveToStorage(updated);
}

/**
 * Marca todas las notificaciones como leídas.
 * (Lo usa la página /notifications)
 */
export function markAllAsRead() {
  if (typeof window === 'undefined') return;
  const current = loadFromStorage();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveToStorage(updated);
}
