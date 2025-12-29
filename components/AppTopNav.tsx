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

type SearchUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

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

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.6-9.2-8.5C.7 7.7 3.1 4.8 6.4 4.6c1.6-.1 3.1.6 4.1 1.8 1-1.2 2.5-1.9 4.1-1.8 3.3.2 5.7 3.1 3.6 6.9C19 15.4 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppTopNav() {
  const pathname = usePathname();

  // Ocultar en landing (/) y /investors
  const hidden = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/" || pathname.startsWith("/investors");
  }, [pathname]);

  const [authed, setAuthed] = useState(false);

  // Activity panel (heart)
  const [openActivity, setOpenActivity] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState<number>(0);

  // Search (magnifier)
  const [openSearch, setOpenSearch] = useState(false);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchUser[]>([]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadNotifications = async () => {
    setLoadingActivity(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setItems([]);
        setUnread(0);
        setAuthed(false);
        return;
      }
      setAuthed(true);

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
      setLoadingActivity(false);
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

  const runSearch = async (query: string) => {
    const s = query.trim();
    if (s.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      // NO requiere auth si tu endpoint es público; si lo haces con Bearer, añade token aquí
      const token = await getAccessToken();
      const res = await fetch(`/api/search-users?q=${encodeURIComponent(s)}&limit=8`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("search-users error:", json);
        setResults([]);
        return;
      }
      setResults((json.users ?? []) as SearchUser[]);
    } finally {
      setSearching(false);
    }
  };

  // Cargar contador al entrar + refresco ligero
  useEffect(() => {
    if (hidden) return;

    loadNotifications();

    const onVis = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    document.addEventListener("visibilitychange", onVis);

    const t = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  // Cerrar paneles al click fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as any)) {
        setOpenActivity(false);
        setOpenSearch(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Search debounce simple
  useEffect(() => {
    if (!openSearch) return;
    const t = window.setTimeout(() => runSearch(q), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, openSearch]);

  if (hidden) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-neutral-800 bg-black/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Izquierda */}
        <div className="flex items-center gap-4">
          <Link href="/feed" className="font-semibold text-sm hover:text-emerald-400">
            Ethiqia
          </Link>

          <nav className="hidden sm:flex items-center gap-3 text-xs text-neutral-300">
            <Link href="/feed" className="hover:text-white">
              Feed
            </Link>
            <Link href="/profile" className="hover:text-white">
              Mi perfil
            </Link>
            <Link href="/score-rules" className="hover:text-white">
              Info Score (Reglas)
            </Link>
          </nav>
        </div>

        {/* Derecha: lupa + corazón */}
        <div className="relative flex items-center gap-2" ref={panelRef}>
          {/* Lupa */}
          <button
            type="button"
            onClick={() => {
              const next = !openSearch;
              setOpenSearch(next);
              if (next) {
                setQ("");
                setResults([]);
              }
            }}
            className="relative rounded-full border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-200 hover:border-neutral-600"
            aria-label="Buscar usuarios"
            title="Buscar usuarios"
          >
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </div>
          </button>

          {openSearch && (
            <div className="absolute right-[172px] mt-2 w-[360px] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <div className="text-sm font-semibold">Buscar usuarios</div>
                <div className="mt-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Nombre o @username (mín. 2 caracteres)"
                    className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-neutral-600"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {q.trim().length < 2 ? (
                  <div className="px-4 py-4 text-xs text-neutral-500">Escribe al menos 2 caracteres.</div>
                ) : searching ? (
                  <div className="px-4 py-4 text-xs text-neutral-400">Buscando…</div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-neutral-500">Sin resultados.</div>
                ) : (
                  <div className="p-2 space-y-2">
                    {results.map((u) => {
                      const name = (u.full_name || "").trim() || "Usuario Ethiqia";
                      const uname = (u.username || "").trim();
                      const initials = (name[0] || "U").toUpperCase();
                      return (
                        <Link
                          key={u.id}
                          href={`/u/${u.id}`}
                          onClick={() => setOpenSearch(false)}
                          className="block rounded-xl border border-neutral-800 bg-black px-3 py-3 hover:border-neutral-600"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                              {u.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.avatar_url} alt={name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-semibold">{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{name}</div>
                              {uname ? <div className="text-[11px] text-neutral-400 truncate">@{uname}</div> : null}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-3 py-3 border-t border-neutral-800 flex items-center justify-between">
                <Link
                  href="/explore"
                  className="text-xs text-emerald-400 hover:underline"
                  onClick={() => setOpenSearch(false)}
                >
                  Ir a explorar →
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenSearch(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Corazón (Actividad/Notificaciones) */}
          <button
            type="button"
            onClick={async () => {
              const next = !openActivity;
              setOpenActivity(next);
              if (next) await loadNotifications();
            }}
            className="relative rounded-full border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-200 hover:border-neutral-600"
            aria-label="Actividad"
            title="Actividad"
          >
            <div className="flex items-center gap-2">
              <HeartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Actividad</span>
            </div>

            {authed && unread > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[11px] font-bold flex items-center justify-center">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {openActivity && (
            <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  Actividad {unread > 0 ? <span className="text-emerald-400">({unread})</span> : null}
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-neutral-400 hover:text-white disabled:opacity-50"
                  disabled={!authed || items.length === 0 || loadingActivity}
                >
                  Marcar todo leído
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {!authed ? (
                  <div className="px-4 py-4 text-xs text-neutral-400">Inicia sesión para ver actividad.</div>
                ) : loadingActivity ? (
                  <div className="px-4 py-4 text-xs text-neutral-400">Cargando…</div>
                ) : items.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-neutral-500">Aún no hay actividad.</div>
                ) : (
                  <div className="p-2 space-y-2">
                    {items.slice(0, 6).map((n) => {
                      const title = n.payload?.title || n.type;
                      const body = n.payload?.body || "";

                      // Etiquetas “tipo” (likes/comentarios/strike/puntos, etc.)
                      const kind =
                        n.type.includes("strike") || title.toLowerCase().includes("strike")
                          ? "STRIKE"
                          : n.type.includes("like")
                          ? "ME GUSTA"
                          : n.type.includes("comment")
                          ? "COMENTARIO"
                          : n.type.includes("points")
                          ? "PUNTOS"
                          : "EVENTO";

                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            if (!n.read_at) markOneRead(n.id);
                          }}
                          className={`w-full text-left rounded-xl border px-3 py-3 ${
                            n.read_at ? "border-neutral-800 bg-black" : "border-emerald-700/40 bg-emerald-500/10"
                          }`}
                          title={n.read_at ? "Leída" : "Click para marcar como leída"}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-white truncate">{title}</div>
                            <div className="text-[10px] text-neutral-500 shrink-0">{kind}</div>
                          </div>
                          {body ? <div className="text-xs text-neutral-300 mt-1">{body}</div> : null}
                          <div className="text-[11px] text-neutral-500 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-3 py-3 border-t border-neutral-800 flex items-center justify-between">
                <Link href="/notifications" className="text-xs text-emerald-400 hover:underline" onClick={() => setOpenActivity(false)}>
                  Ver todas
                </Link>
                <button type="button" onClick={() => setOpenActivity(false)} className="text-xs text-neutral-400 hover:text-white">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
