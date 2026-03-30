"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location?: string | null;
};

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => q.trim(), [q]);

  const load = async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      // Nota: si RLS bloquea SELECT en profiles, esto te devolverá error.
      let req = supabaseBrowser
        .from("profiles")
        .select("id, full_name, username, avatar_url, location")
        .limit(30);

      if (term) {
        // Búsqueda básica (ilike) por full_name o username
        // Importante: esto requiere que tu policy permita SELECT y que existan esas columnas.
        req = req.or(`full_name.ilike.%${term}%,username.ilike.%${term}%`);
      }

      const { data, error } = await req;
      if (error) {
        console.error("Explore profiles error:", error);
        setProfiles([]);
        setError("No se han podido cargar perfiles (probable RLS en profiles).");
        return;
      }
      setProfiles((data as ProfileRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => load(query), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Explorar</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Busca perfiles por nombre o username.
            </p>
          </div>
          <Link href="/feed" className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors">
            ← Volver al feed
          </Link>
        </div>

        <div className="mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: david, @davidguirao, velet…"
            className="w-full rounded-xl bg-black border border-neutral-800 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {error ? <div className="text-xs text-red-300 mt-2">{error}</div> : null}
        </div>

        {loading ? (
          <div className="text-sm text-neutral-400">Cargando…</div>
        ) : profiles.length === 0 ? (
          <div className="text-sm text-neutral-500">No hay resultados.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const name = p.full_name?.trim() || (p.username ? `@${p.username}` : "Usuario Ethiqia");
              const subtitle = p.username ? `@${p.username}` : p.location || "";
              return (
                <Link
                  key={p.id}
                  href={`/u/${p.id}`}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600 transition-colors flex items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{(name[0] || "U").toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{name}</div>
                    {subtitle ? <div className="text-xs text-neutral-500 truncate">{subtitle}</div> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
