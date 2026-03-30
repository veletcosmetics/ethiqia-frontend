"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9m10-2.5V11a7 7 0 10-14 0v3.5L3 17h18l-2-2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 004 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AppTopNav() {
  const pathname = usePathname();

  const hidden = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/" || pathname.startsWith("/investors");
  }, [pathname]);

  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState<number>(0);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setItems([]);
        setUnread(0);
        setAuthed(false);
        return;
      }
      setAuthed(true);

      // Cargar nombre y avatar del usuario (solo la primera vez)
      if (!userName) {
        try {
          const { data: { user } } = await supabaseBrowser.auth.getUser();
          if (user) {
            const { data: prof } = await supabaseBrowser
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", user.id)
              .maybeSingle();
            if (prof?.full_name) setUserName(prof.full_name);
            if (prof?.avatar_url) setUserAvatar(prof.avatar_url);
          }
        } catch { /* no-op */ }
      }

      const res = await fetch("/api/notifications?limit=30", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("TopNav notifications error:", json);
        setItems([]);
        setUnread(0);
        return;
      }

      const list = (json.notifications ?? []) as NotificationRow[];
      setItems(list);
      setUnread(list.filter((n) => !n.read_at).length);
    } finally {
      setLoading(false);
    }
  };

  const markOneRead = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    await loadNotifications();
  };

  const markAllRead = async () => {
    const token = await getAccessToken();
    if (!token) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ markAllRead: true }),
    });
    await loadNotifications();
  };

  useEffect(() => {
    if (hidden) return;

    loadNotifications();

    const onVis = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    document.addEventListener("visibilitychange", onVis);

    const t = window.setInterval(() => loadNotifications(), 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (hidden) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-neutral-800 bg-black/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/feed" className="font-semibold text-sm hover:text-emerald-400">
            Ethiqia
          </Link>

          <nav className="hidden sm:flex items-center gap-3 text-xs text-neutral-300">
            <Link href="/feed" className="hover:text-white">
              Feed
            </Link>
            <Link href="/explore" className="hover:text-white">
              Explorar
            </Link>
            <Link href="/profile" className="hover:text-white">
              Mi perfil
            </Link>
            <Link href="/company" className="hover:text-white">
              Empresas
            </Link>
            <Link href="/score-rules" className="hover:text-white">
              Reglas
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Lupa */}
          <Link
            href="/explore"
            className="rounded-full border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-200 hover:border-neutral-600"
            aria-label="Buscar usuarios"
            title="Buscar usuarios"
          >
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </div>
          </Link>

          {/* Avatar usuario → /profile */}
          {authed && (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-2 py-1.5 text-xs text-neutral-200 hover:border-neutral-600 transition-colors"
              title="Mi perfil"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold">
                    {(userName?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline max-w-[80px] truncate">{userName ?? "Perfil"}</span>
            </Link>
          )}

          {/* Campana */}
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={async () => {
                const next = !open;
                setOpen(next);
                if (next) await loadNotifications();
              }}
              className="relative rounded-full border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-200 hover:border-neutral-600"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Notificaciones</span>
              </div>

              {authed && unread > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[11px] font-bold flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    Notificaciones{" "}
                    {unread > 0 ? <span className="text-emerald-400">({unread})</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-neutral-400 hover:text-white disabled:opacity-50"
                    disabled={!authed || items.length === 0 || loading}
                  >
                    Marcar todo leído
                  </button>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {!authed ? (
                    <div className="px-4 py-4 text-xs text-neutral-400">
                      Inicia sesión para ver notificaciones.
                    </div>
                  ) : loading ? (
                    <div className="px-4 py-4 text-xs text-neutral-400">Cargando…</div>
                  ) : items.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-neutral-500">Aún no hay notificaciones.</div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {items.slice(0, 6).map((n) => {
                        const title = n.payload?.title || n.type;
                        const body = n.payload?.body || "";
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              if (!n.read_at) markOneRead(n.id);
                            }}
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

                <div className="px-3 py-3 border-t border-neutral-800 flex items-center justify-between">
                  <Link
                    href="/notifications"
                    className="text-xs text-emerald-400 hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Ver todas
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
