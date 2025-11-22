'use client';

import { useEffect, useState } from 'react';

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt?: number;
};

const FEED_KEY = 'ethiqia_feed_posts';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(FEED_KEY);
      const userPosts: FeedPost[] = raw ? JSON.parse(raw) : [];

      userPosts.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      setPosts(userPosts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando feed…</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed demo
          </p>
          <h1 className="text-2xl font-semibold">Tus publicaciones en Ethiqia</h1>
          <p className="text-sm text-neutral-400">
            Aquí solo ves tus publicaciones generadas desde la demo en vivo, sin
            perfiles falsos ni ejemplos simulados.
          </p>
        </header>

        <div className="space-y-6 pb-10">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border border-neutral-800 rounded-2xl bg-neutral-900/70 overflow-hidden"
            >
              {/* Cabecera */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold overflow-hidden">
                  <span>Tú</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-100">
                    Tu perfil Ethiqia (demo)
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Publicación creada desde la demo en vivo
                  </p>
                </div>
              </div>

              {/* Imagen */}
              <div className="bg-black">
                <img
                  src={post.imageUrl}
                  alt="Publicación Ethiqia"
                  className="w-full max-h-[520px] object-cover"
                />
              </div>

              {/* Pie */}
              <div className="px-4 py-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-neutral-200">
                    <span className="font-semibold">Ethiqia Score:</span>{' '}
                    {post.score}/100
                  </p>
                  <div className="flex items-center gap-3 text-[13px] text-neutral-400">
                    <button
                      type="button"
                      className="hover:text-emerald-300"
                    >
                      ♡ Me gusta
                    </button>
                    <button
                      type="button"
                      className="hover:text-emerald-300"
                    >
                      💾 Guardar
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Esta es una demo local. En la versión completa, el feed se
                  alimentará de publicaciones reales verificadas por Ethiqia
                  desde el backend.
                </p>
              </div>
            </article>
          ))}

          {posts.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no hay publicaciones. Sube una imagen desde la demo en vivo
              para generar tu primera publicación.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
