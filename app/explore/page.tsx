"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type FeedItem = {
  post: Post;
  authorName: string;
  authorAvatarUrl: string;
};

export default function ExplorePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadExplore = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        // Explore puede ser público, pero tu API /api/posts exige auth.
        // Así que si no hay sesión, mostramos CTA a login.
        setItems([]);
        setAuthed(false);
        return;
      }
      setAuthed(true);

      // 1) Traer posts recientes (no "mine")
      const res = await fetch(`/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Explore /api/posts error:", json);
        setItems([]);
        return;
      }

      const posts = (json?.posts ?? []) as Post[];

      // 2) Resolver autores (profiles) en una sola query
      const userIds = Array.from(
        new Set(posts.map((p: any) => p.user_id).filter(Boolean))
      );

      let profilesMap = new Map<string, ProfileRow>();
      if (userIds.length > 0) {
        const { data: profs, error } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", userIds);

        if (error) {
          console.error("Explore load profiles error:", error);
        } else {
          (profs ?? []).forEach((r: any) => profilesMap.set(r.id, r as ProfileRow));
        }
      }

      const merged: FeedItem[] = posts.map((p: any) => {
        const pr = profilesMap.get(p.user_id);
        const name =
          pr?.full_name?.trim() ||
          (pr?.username ? `@${String(pr.username).replace(/^@+/, "")}` : "") ||
          "Usuario Ethiqia";

        return {
          post: p,
          authorName: name,
          authorAvatarUrl: pr?.avatar_url ?? "",
        };
      });

      setItems(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // No forzamos redirect aquí; Explore lo puedes permitir con login requerido si tu API lo exige.
        const { data } = await supabaseBrowser.auth.getUser();
        setAuthed(Boolean(data?.user));
      } catch {
        setAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    loadExplore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  const count = items.length;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-semibold">Explorar</h1>
            <div className="text-xs text-neutral-400 mt-1">
              {loading ? "Cargando…" : `${count} publicaciones`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadExplore}
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Actualizando…" : "Actualizar"}
            </button>

            <Link
              href="/feed"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Volver al feed
            </Link>
          </div>
        </div>

        {!authed ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="text-sm font-semibold">Necesitas iniciar sesión</div>
            <div className="text-sm text-neutral-400 mt-2">
              Ahora mismo tu API de posts requiere sesión. Inicia sesión para explorar publicaciones.
            </div>
            <div className="mt-4">
              <Link
                href="/login"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black"
              >
                Ir a login
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="text-sm text-neutral-400">Cargando publicaciones…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-neutral-500">Aún no hay publicaciones para explorar.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <button
                key={it.post.id}
                type="button"
                onClick={() => setSelectedPost(it)}
                className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-800 bg-black hover:border-neutral-600"
                title="Ver publicación"
              >
                {(it.post as any).image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(it.post as any).image_url}
                    alt="Post"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500">
                    Sin imagen
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Modal ver post */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Publicación</div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>

            <PostCard
              post={selectedPost.post}
              authorName={selectedPost.authorName}
              authorAvatarUrl={selectedPost.authorAvatarUrl}
            />
          </div>
        </div>
      )}
    </main>
  );
}
