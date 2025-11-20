'use client';

import { useEffect, useState } from 'react';
import {
  EthiqiaNotification,
  getNotifications,
  markAllAsRead,
} from '../../lib/notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<EthiqiaNotification[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNotifications(getNotifications());
  }, []);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Notificaciones</h1>
            <p className="text-sm text-neutral-400">
              Actividad generada por la IA de Ethiqia: moderación, puntuaciones y avisos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] rounded-full border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
          >
            Marcar todas como leídas
          </button>
        </header>

        <section className="space-y-2">
          {notifications.length === 0 && (
            <p className="text-sm text-neutral-500">
              No tienes notificaciones por ahora. Tu actividad está tranquila.
            </p>
          )}

          {notifications.map((notif) => (
            <article
              key={notif.id}
              className={`rounded-xl border px-4 py-3 text-sm ${
                notif.read
                  ? 'border-neutral-800 bg-neutral-900/60'
                  : 'border-emerald-600/50 bg-neutral-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-neutral-100">{notif.message}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {new Date(notif.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
