"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type NotificationPayload = {
  title?: string;
  body?: string;
  points_awarded?: number;
  points_delta?: number;
  post_id?: string;
  event_id?: string;
  [k: string]: any;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  payload: NotificationPayload | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => items.filter((n) => !n.read_at).length, [items]);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setItems([]);
        router.push("/login");
        return;
      }

      // Puedes subir el limit si quieres (ej: 200)
      const res = await fetch("/api/notifications?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("notifications page error:", json);
        setError("No se han podido cargar las notificaciones.");
        setItems([]);
        return;
      }

      setItems((json.notifications ?? []) as NotificationRow[]);
    } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (id: string) => {
    const token = await getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });

    await loadAll();
  };

  const markAllRead = async () => {
    const token = await getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ markAllRead: true }),
    });

    await loadAll();
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabaseBrowser.auth.getUser();
        if (!data?.user) {
          setAuthChecked(true);
          router.push("/login");
          return;
        }
        await loadAll();
      } finally {
        setAuthChecked(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Notificaciones</h1>
            <div className="text-xs text-neutral-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Volver al feed
            </Link>

            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600 disabled:opacity-50"
            >
              {loading ? "Actualizando…" : "Actualizar"}
            </button>

            <button
              type="button"
              onClick={markAllRead}
              disabled={loading || items.length === 0 || unreadCount === 0}
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600 disabled:opacity-50"
            >
              Marcar todo leído
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          {error ? (
            <div className="text-xs text-red-400">{error}</div>
          ) : loading ? (
            <div className="text-xs text-neutral-400">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-neutral-500">Aún no hay notificaciones.</div>
          ) : (
            <div className="space-y-2">
              {items.map((n) => {
                const title = n.payload?.title || n.type;
                const body = n.payload?.body || "";
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read_at && markOneRead(n.id)}
                    className={`w-full text-left rounded-xl border px-3 py-3 ${
                      n.read_at
                        ? "border-neutral-800 bg-black"
                        : "border-emerald-700/40 bg-emerald-500/10"
                    }`}
                    title={n.read_at ? "Leída" : "Click para marcar como leída"}
                  >
                    <div className="text-xs font-semibold text-white">{title}</div>
                    {body ? <div className="text-xs text-neutral-300 mt-1">{body}</div> : null}
                    <div className="text-[11px] text-neutral-500 mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
