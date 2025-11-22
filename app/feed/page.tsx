'use client';

import { useEffect, useState } from 'react';

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

const STORAGE_KEY_FEED = 'ethiqia_feed_posts';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_FEED);
      const parsed: FeedPost[] = raw ? JSON.parse(raw) : [];
      setPosts(parsed);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones reales en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Aquí solo se muestran fotos subidas desde la demo en vivo. No hay
            imágenes falsas ni perfiles simulados: todo lo que ves ha pasado por
            el análisis IA de Ethiqia en este navegador.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-neutral-500">Cargando publicaciones…</p>
        )}

        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300 space-y-2">
            <p className="font-medium">Todavía no hay publicaciones reales.</p>
            <p className="text-xs text-neutral-400">
              Sube una imagen desde{' '}
              <span className="font-semibold">Tu bio → “Subir foto en demo live”</span>{' '}
              y aparecerá aquí con su Ethiqia Score.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
            >
              <div className="w-full bg-neutral-900">
                <img
                  src={post.imageUrl}
                  alt="Publicación Ethiqia"
                  className="w-full max-h-[520px] object-cover"
                />
              </div>
              <div className="px-4 py-3 space-y-1 text-sm">
                <p className="text-neutral-200 font-medium">
                  Publicación analizada por Ethiqia
                </p>
                <p className="text-[13px] text-neutral-400">
                  Esta imagen se ha subido desde la demo en tiempo real y ha
                  recibido un Ethiqia Score basado en autenticidad,
                  coherencia y probabilidad de IA.
                </p>
                <p className="text-[12px] text-neutral-300">
                  <span className="font-semibold">Ethiqia Score:</span>{' '}
                  {post.score}/100
                </p>
                <p className="text-[11px] text-neutral-500">
                  Fecha:{' '}
                  {new Date(post.createdAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
