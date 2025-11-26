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

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);

  useEffect(() => {
    const list = loadLocalPosts().sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );
    setPosts(list);
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Feed de Ethiqia (demo local)</h1>
          <p className="text-sm text-neutral-400">
            Aquí solo se muestran las imágenes que has subido desde{' '}
            <code>/demo/live</code> en este navegador. Todo está guardado en{' '}
            <code>localStorage</code>, sin backend ni Supabase.
          </p>
        </header>

        {posts.length === 0 && (
          <p className="text-sm text-neutral-500 mt-6">
            Aún no hay publicaciones locales. Sube tu primera foto en{' '}
            <span className="font-semibold text-emerald-400">Demo &gt; Live</span>.
          </p>
        )}

        <div className="space-y-6">
          {posts.map((post) => {
            const auth = post.authenticity ?? 75;
            const aiProb = post.aiProbability ?? 30;
            const coh = post.coherence ?? 80;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/80"
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold">
                      U
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-100">
                        Usuario Ethiqia
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Usuario demo · LocalStorage
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-neutral-500">
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-[11px] text-amber-300">
                      Prob. IA estimada · {aiProb}%
                    </span>
                  </div>
                </div>

                {/* Imagen */}
                <div className="bg-black">
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Publicación Ethiqia'}
                    className="max-h-[520px] w-full object-contain bg-black"
                  />
                </div>

                {/* Texto + métricas */}
                <div className="px-4 py-3 space-y-3">
                  {post.caption && (
                    <p className="text-sm text-neutral-100">{post.caption}</p>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-neutral-400">
                      Ethiqia Score global
                    </p>
                    <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(post.score ?? 0, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-neutral-300 flex justify-between">
                      <span>Score</span>
                      <span className="font-semibold text-emerald-400">
                        {post.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Barras detalladas */}
                  <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Autenticidad</span>
                        <span className="font-medium text-neutral-100">
                          {auth}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${auth}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Prob. IA</span>
                        <span className="font-medium text-neutral-100">
                          {aiProb}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${aiProb}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Coherencia</span>
                        <span className="font-medium text-neutral-100">
                          {coh}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${coh}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Acciones (solo visuales) */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>❤️</span>
                      <span>Te gusta</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>💬</span>
                      <span>Comentar</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>📎</span>
                      <span>Guardado</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>📤</span>
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
