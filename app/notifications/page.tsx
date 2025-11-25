'use client';

import { useEffect, useState } from 'react';
import {
  EthiqiaNotification,
  getNotifications,
  markAllAsRead,
} from '../../lib/notifications';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function getTitle(type: EthiqiaNotification['type']): string {
  switch (type) {
    case 'post-scored':
      return 'ETHIQIA SCORE';
    case 'comment-approved':
      return 'COMENTARIO APROBADO';
    case 'comment-blocked':
      return 'COMENTARIO BLOQUEADO';
    default:
      return 'ACTIVIDAD';
  }
}

function getTag(type: EthiqiaNotification['type']): string {
  switch (type) {
    case 'post-scored':
      return 'Reputación';
    case 'comment-approved':
      return 'Actividad positiva';
    case 'comment-blocked':
      return '-0,8 puntos Ethiqia';
    default:
      return '';
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<EthiqiaNotification[]>([]);

  useEffect(() => {
    // Carga inicial
    setItems(getNotifications());
  }, []);

  const handleMarkAll = () => {
    markAllAsRead();
    setItems(getNotifications());
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Centro de notificaciones
            </p>
            <h1 className="text-2xl font-semibold">Tu actividad en Ethiqia</h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Aquí ves cómo tus acciones afectan a tu Ethiqia Score: análisis de
              publicaciones, comentarios aprobados y comentarios bloqueados por
              IA (cada comentario bloqueado te resta 0,8 puntos en el modelo
              conceptual de reputación).
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAll}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:border-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Marcar todo como leído
          </button>
        </header>

        {items.length === 0 && (
          <p className="text-sm text-neutral-500 border border-dashed border-neutral-800 rounded-2xl px-4 py-8 text-center">
            Aún no tienes notificaciones. Sube una foto en la demo en vivo o
            deja algún comentario para ver cómo se generan aquí.
          </p>
        )}

        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-3 text-sm ${
                n.read
                  ? 'border-neutral-800 bg-neutral-900/60'
                  : 'border-emerald-500/60 bg-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                  )}
                  <span className="text-xs font-semibold text-neutral-200 uppercase tracking-[0.16em]">
                    {getTitle(n.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  {getTag(n.type) && (
                    <span className="rounded-full border border-neutral-700 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-neutral-300">
                      {getTag(n.type)}
                    </span>
                  )}
                  <span>{formatDate(n.created_at)}</span>
                </div>
              </div>

              <p className="mt-1 text-neutral-100">{n.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
