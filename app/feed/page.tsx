'use client';

import { useEffect, useState } from 'react';

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (!raw) return;
      const data = JSON.parse(raw) as FeedPost[];
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch {
      // ignoramos errores
    }
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed demo
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones analizadas por Ethiqia
          </h1>
          <p className="text-sm text-neutral-400">
            Aquí se muestran las imágenes que has subido desde la demo en tiempo
            real (<code className="text-xs bg-neutral-900 px-1 py-[1px] rounded">
              /demo/live
            </code>), junto con su Ethiqia Score.
          </p>
        </header>

        {/* Lista de publicaciones */}
        <section className="space-y-6">
          {posts.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no hay publicaciones. Sube una imagen desde{' '}
              <code className="text-xs bg-neutral-900 px-1 py-[1px] rounded">
                /demo/live
              </code>{' '}
              para generar tu primera entrada en el feed.
            </p>
          )}

          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
            >
              <div className="bg-neutral-900">
                <img
                  src={post.imageUrl}
                  alt="Publicación"
                  className="w-full max-h-[420px] object-cover"
                />
              </div>

              <div className="px-4 py-3 space-y-1 text-sm">
                <p className="text-neutral-200">
                  <span className="font-semibold">Ethiqia Score:</span>{' '}
                  {post.score}/100
                </p>
                <p className="text-[11px] text-neutral-500">
                  Publicado el{' '}
                  {new Date(post.createdAt).toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-[11px] text-neutral-500">
                  *En la versión completa, aquí se mostrarían también los
                  comentarios, likes y el detalle del análisis IA.
                </p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
