// lib/notifications.ts

export type EthiqiaNotificationType =
  | 'comment-approved'
  | 'post-scored'
  | 'generic';

export type EthiqiaNotification = {
  id: string;
  type: EthiqiaNotificationType;
  message: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = 'ethiqia_notifications';

function getInitialNotifications(): EthiqiaNotification[] {
  return [
    {
      id: 'n1',
      type: 'comment-approved',
      message: 'Tu comentario fue aprobado por la IA.',
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: 'n2',
      type: 'post-scored',
      message: 'Tu publicación generó 87 puntos de Ethiqia Score.',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ];
}

export function getNotifications(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return getInitialNotifications();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialNotifications();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as EthiqiaNotification[];
    return Array.isArray(parsed) ? parsed : getInitialNotifications();
  } catch {
    return getInitialNotifications();
  }
}

export function saveNotifications(notifs: EthiqiaNotification[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

export function addNotification(type: EthiqiaNotificationType, message: string) {
  if (typeof window === 'undefined') return;
  const current = getNotifications();
  const newNotif: EthiqiaNotification = {
    id: `n-${Date.now()}`,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  saveNotifications([newNotif, ...current]);
}

export function markAllAsRead() {
  if (typeof window === 'undefined') return;
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

export function getUnreadCount(): number {
  const notifs = getNotifications();
  return notifs.filter((n) => !n.read).length;
}
