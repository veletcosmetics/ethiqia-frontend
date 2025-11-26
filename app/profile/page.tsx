'use client';

import { useEffect, useState } from 'react';

type DemoPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
  caption?: string;
  authenticity?: number;
  aiProbability?: number;
  coherence?: number;
};

const STORAGE_KEY_FEED = 'ethiqia_feed_posts';

function loadLocalPosts(): DemoPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEED);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function ProfilePage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);

  useEffect(() => {
    const list = loadLocalPosts().sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );
    setPosts(list);
  }, []);

  const total = posts.length;
  const last = posts[0];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cabecera perfil */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-semibold">
              D
            </div>
            <div>
              <h1 className="text-xl font-semibold">David Guirao (demo)</h1>
              <p className="text-xs text-neutral-400">
                Demo local de Ethiqia · sin backend · solo en este navegador.
              </p>
            </div>
          </div>
          <button className="self-start rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-xs text-neutral-200 hover:border-emerald-400 hover:text-emerald-300">
            Editar perfil (demo visual)
          </button>
        </header>

        {/* Bio + métricas rápidas */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
            <p className="text-sm text-neutral-300">
              Este es tu espacio personal en Ethiqia. En esta versión demo, las
              fotos que subes desde <code>/demo/live</code> se guardan en{' '}
              <code>localStorage</code> y se muestran aquí como si fueran
              publicaciones reales.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-2">
            <h3 className="text-sm font-semibold text-neutral-100">
              Resumen rápido
            </h3>
            <p className="flex justify-between text-neutral-300">
              <span>Publicaciones locales</span>
              <span className="font-semibold text-emerald-400">{total}</span>
            </p>
            <p className="flex justify-between text-neutral-300">
              <span>Último Ethiqia Score</span>
              <span className="font-semibold text-emerald-400">
                {last ? `${last.score}/100` : '–'}
              </span>
            </p>
            {last && (
              <p className="text-[11px] text-neutral-500">
                Última publicación: {formatDate(last.createdAt)}
              </p>
            )}
          </div>
        </section>

        {/* Tus publicaciones */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Tus publicaciones
            </h2>
            <span className="text-[11px] text-neutral-500">
              Sube nuevas fotos desde{' '}
              <code className="text-emerald-400">/demo/live</code>
            </span>
          </div>

          {posts.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no has subido ninguna imagen en esta demo local.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/80 flex flex-col"
              >
                <div className="bg-black">
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Publicación Ethiqia'}
                    className="w-full max-h-[320px] object-contain bg-black"
                  />
                </div>
                <div className="px-4 py-3 space-y-2 text-xs">
                  <p className="text-[11px] text-neutral-500">
                    {formatDate(post.createdAt)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Ethiqia Score</span>
                    <span className="font-semibold text-emerald-400">
                      {post.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(post.score ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
