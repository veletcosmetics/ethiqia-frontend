'use client';

import { useEffect, useState } from 'react';
import {
  DemoNotification,
  loadNotifications,
  markNotificationAsRead,
} from '../../lib/demoStorage';

export default function NotificationsBar() {
  const [notif, setNotif] = useState<DemoNotification | null>(null);

  useEffect(() => {
    const list = loadNotifications().filter((n) => !n.read);
    if (list.length > 0) {
      setNotif(list[0]);
    }
  }, []);

  if (!notif) return null;

  const bg =
    notif.type === 'error'
      ? 'bg-red-900/60 border-red-500/70'
      : notif.type === 'score'
      ? 'bg-emerald-900/60 border-emerald-500/70'
      : 'bg-slate-800/80 border-slate-600';

  const label =
    notif.type === 'error'
      ? 'Error'
      : notif.type === 'score'
      ? 'Ethiqia Score'
      : 'Notificación';

  const handleClose = () => {
    markNotificationAsRead(notif.id);
    setNotif(null);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 w-[95%] max-w-xl -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm shadow-xl ${bg}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          {label}
        </div>
        <div className="flex-1 text-slate-50">{notif.message}</div>
        <button
          onClick={handleClose}
          className="ml-2 text-xs text-slate-300 hover:text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
