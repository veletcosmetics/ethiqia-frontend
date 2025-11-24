// lib/notifications.ts

export type EthiqiaNotificationType =
  | 'post-scored'
  | 'comment-approved'
  | 'comment-blocked'
  | 'demo-info';

export interface EthiqiaNotification {
  id: string;
  type: EthiqiaNotificationType;
  message: string;
  createdAt: number;
}

// 🔔 Etiquetas por tipo de notificación
export const NOTIFICATION_LABELS: Record<EthiqiaNotificationType, string> = {
  'post-scored': 'Tu publicación ha recibido un Ethiqia Score.',
  'comment-approved': 'Tu comentario fue publicado.',
  'comment-blocked': 'Tu comentario fue bloqueado por la IA.',
  'demo-info': 'Información de la demo.'
};

// 🔔 Guarda una notificación en localStorage (versión demo)
export function addNotification(type: EthiqiaNotificationType, message: string) {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem('ethiqia_notifications');
    const list: EthiqiaNotification[] = raw ? JSON.parse(raw) : [];

    const newNotif: EthiqiaNotification = {
      id: `n-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      type,
      message,
      createdAt: Date.now()
    };

    const updated = [newNotif, ...list];
    localStorage.setItem('ethiqia_notifications', JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando notificación:', e);
  }
}

// 🔔 Cargar todas las notificaciones
export function getNotifications(): EthiqiaNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ethiqia_notifications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 🔔 Borrar una notificación concreta
export function deleteNotification(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('ethiqia_notifications');
    const list: EthiqiaNotification[] = raw ? JSON.parse(raw) : [];
    const updated = list.filter(n => n.id !== id);
    localStorage.setItem('ethiqia_notifications', JSON.stringify(updated));
  } catch {}
}

// 🔔 Limpiar todo (por si lo necesitas)
export function clearNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ethiqia_notifications');
}
