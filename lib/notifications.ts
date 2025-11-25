// NOTIFICACIONES ETHIQIA – COMPLETO Y ARREGLADO
// =============================================

// Tipos de notificación permitidos
export type EthiqiaNotificationType =
  | 'post-scored'
  | 'comment-approved'
  | 'comment-blocked';

// Objeto de notificación
export interface EthiqiaNotification {
  id: string;
  type: EthiqiaNotificationType;
  message: string;
  created_at: number; // timestamp
  read: boolean;
}

// Obtener notificaciones almacenadas en localStorage
export function getNotifications(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('ethiqia_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Guardar notificaciones en localStorage
export function saveNotifications(list: EthiqiaNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ethiqia_notifications', JSON.stringify(list));
}

// Añadir una notificación nueva
export function addNotification(type: EthiqiaNotificationType, message: string) {
  const current = getNotifications();

  const newNote: EthiqiaNotification = {
    id: crypto.randomUUID(),
    type,
    message,
    created_at: Date.now(),
    read: false,
  };

  current.unshift(newNote);
  saveNotifications(current);

  return newNote;
}

// Marcar una como leída
export function markAsRead(id: string) {
  const list = getNotifications();
  const updated = list.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

// Marcar todas como leídas
export function markAllAsRead() {
  const list = getNotifications();
  const updated = list.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}
