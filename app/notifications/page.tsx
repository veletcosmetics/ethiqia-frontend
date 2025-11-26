'use client';

import { useEffect, useState } from 'react';
import {
  DemoNotification,
  loadNotifications,
  clearAllNotifications,
  markNotificationAsRead,
} from '../../lib/demoStorage';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);

  useEffect(() => {
    const list = loadNotifications();
    setNotifications(list);
  }, []);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(loadNotifications());
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Notificaciones</h1>
            <p className="text-sm text-slate-400">
              Actividad generada en esta demo local de Ethiqia desde este
              navegador.
            </p>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-red-500 hover:text-red-300"
            >
              Borrar todas
            </button>
          )}
        </header>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400">
            Todavía no hay notificaciones. Sube una imagen desde la demo Live o
            genera actividad para verlas aquí.
          </p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm ${
                  n.type === 'error'
                    ? 'border-red-700/80 bg-red-950/60'
                    : n.type === 'score'
                    ? 'border-emerald-600/80 bg-emerald-950/50'
                    : 'border-slate-700 bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-300">
                    {n.type === 'error'
                      ? 'Error'
                      : n.type === 'score'
                      ? 'Ethiqia Score'
                      : 'Sistema'}
                  </div>
                  <div className="text-slate-50">{n.message}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {n.read ? ' · leída' : ' · no leída'}
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="mt-1 rounded-full border border-slate-500 px-3 py-1 text-[11px] text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
                  >
                    Marcar como leída
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
