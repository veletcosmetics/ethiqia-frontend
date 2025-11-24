'use client';

import { useEffect, useState } from 'react';
import {
  EthiqiaNotification,
  getNotifications,
  markAllAsRead,
} from '../../lib/notifications';

export default function NotificationsPage() {
  const [items, setItems] = useState<EthiqiaNotification[]>([]);

  useEffect(() => {
    // leemos del localStorage en el cliente
    const list = getNotifications();
    setItems(list);
  }, []);

  const handleMarkAll = () => {
    markAllAsRead();
    // actualizamos estado en memoria
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Centro de actividad
            </p>
            <h1 className="text-2xl font-semibold">Notificaciones</h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Aquí verás los avisos importantes de Ethiqia: puntuaciones de tus
              publicaciones, comentarios aprobados o bloqueados por la IA, etc.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs px-3 py-1.5 rounded-full border border-neutral-700 hover:border-emerald-400 hover:text-emerald-300 transition"
            >
              Marcar todo como leído
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-400">
            Aún no tienes notificaciones. Cuando publiques fotos o la IA modere
            algún comentario, verás los avisos aquí.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  n.read
                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-400'
                    : 'border-emerald-500/60 bg-neutral-900 text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-emerald-400">
                    {formatType(n.type)}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{n.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function formatType(type: EthiqiaNotification['type']): string {
  switch (type) {
    case 'post-scored':
      return 'ETHIQIA SCORE';
    case 'comment-approved':
      return 'COMENTARIO APROBADO';
    case 'comment-blocked':
      return 'COMENTARIO BLOQUEADO';
    default:
      return 'NOTIFICACIÓN';
  }
}

function formatDate(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return '';
  }
}
