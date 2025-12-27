"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
};

function Avatar({
  name,
  url,
}: {
  name: string;
  url?: string | null;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }
  const letter = (name?.[0] || "U").toUpperCase();
  return (
    <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-semibold">
      {letter}
    </div>
  );
}

function sanitizeQuery(q: string) {
  // Evita romper el .or(...) con comas o % raros
  return (q || "").trim().replace(/[%]/g, "").replace(/,/g, " ");
}

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => sanitizeQuery(q), [q]);

  const loadSuggested = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("id, full_name, username, bio, location, avatar_url")
        .order("updated_at", { ascending: false })
        .limit(24);

      if (error) {
        console.error("Explore suggested error:", error);
        setRows([]);
        setError("No se han podido cargar usuarios (RLS o permisos).");
        return;
      }

      setRows((data as ProfileRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  const search = async (term: string) => {
    const t = sanitizeQuery(term);
    if (!t) {
      await loadSuggested();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // OR: full_name ilike %t% o username ilike %t%
      const pattern = `%${t}%`;

      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("id, full_name, username, bio, location, avatar_url")
        .or(`full_name.ilike.${pattern},username.ilike.${pattern}`)
        .limit(24);

      if (error) {
        console.error("Explore search error:", error);
        setRows([]);
        setError("No se ha podido buscar (RLS o permisos).");
        return;
      }

      setRows((data as ProfileRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial: sugeridos
  useEffect(() => {
    loadSuggested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const t = window.setTimeout(() => {
      search(query);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-semibold">Buscar usuarios</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Encuentra perfiles por nombre o @username.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/score-rules"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Info Score
            </Link>
            <Link
              href="/feed"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Volver al feed
            </Link>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <label className="text-xs text-neutral-400 block mb-2">
            Buscar
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: david, velet, @davidguirao…"
            className="w-full rounded-xl bg-black border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              {loading ? "Buscando…" : rows.length ? `${rows.length} resultados` : "Sin resultados"}
            </div>

            <button
              type="button"
              onClick={() => {
                setQ("");
                loadSuggested();
              }}
              className="text-xs text-neutral-400 hover:text-emerald-400"
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="mt-5">
          {error ? (
            <div className="rounded-2xl border border-red-900/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
              <div className="text-xs text-neutral-400 mt-2">
                Si esto pasa, es casi seguro que tu RLS de <span className="text-white">profiles</span> no permite SELECT.
              </div>
            </div>
          ) : loading ? (
            <p className="text-sm text-neutral-400">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay usuarios para mostrar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rows.map((u) => {
                const name =
                  u.full_name?.trim() ||
                  (u.username ? `@${u.username}` : "Usuario Ethiqia");

                const username = (u.username || "").trim().replace(/^@+/, "");
                const showUsername = username ? `@${username}` : "";

                return (
                  <Link
                    key={u.id}
                    href={`/u/${u.id}`}
                    className="block rounded-2xl border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-colors p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={name} url={u.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{name}</div>
                        {showUsername ? (
                          <div className="text-xs text-neutral-400 truncate">{showUsername}</div>
                        ) : (
                          <div className="text-xs text-neutral-600 truncate">{u.id}</div>
                        )}

                        {(u.location || u.bio) ? (
                          <div className="mt-2 text-xs text-neutral-300">
                            {u.location ? <div className="truncate">📍 {u.location}</div> : null}
                            {u.bio ? (
                              <div className="text-neutral-400 mt-1 line-clamp-2 whitespace-pre-line">
                                {u.bio}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-xs text-emerald-400 shrink-0">Ver →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
