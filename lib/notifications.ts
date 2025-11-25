// lib/notifications.ts

const STORAGE_KEY = 'ethiqia_notifications';

export type EthiqiaNotificationType =
  | 'post-scored'
  | 'comment-blocked'
  | 'info';

export type EthiqiaNotification = {
  id: string;
  type: EthiqiaNotificationType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
};

function loadNotifications(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as EthiqiaNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotifications(list: EthiqiaNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignoramos errores de almacenamiento
  }
}

export function getNotifications(): EthiqiaNotification[] {
  return loadNotifications().sort((a, b) => b.createdAt - a.createdAt);
}

export function addNotification(
  type: EthiqiaNotificationType,
  message: string
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  let title = 'Actividad en Ethiqia';

  if (type === 'post-scored') {
    title = 'Nueva publicación analizada';
  } else if (type === 'comment-blocked') {
    title = 'Comentario bloqueado por IA';
  }

  const notification: EthiqiaNotification = {
    id: `n-${now}-${Math.random().toString(16).slice(2)}`,
    type,
    title,
    message,
    createdAt: now,
    read: false,
  };

  const current = loadNotifications();
  const updated = [notification, ...current].slice(0, 100); // max 100
  saveNotifications(updated);
}

export function markAllAsRead(): void {
  const current = loadNotifications();
  if (!current.length) return;
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}
