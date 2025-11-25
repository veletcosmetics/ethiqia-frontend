'use client';

import { useEffect, useState } from 'react';

type StoredPost = {
  id: string;
  imageUrl: string;
  score?: number;
  createdAt?: number;
};

type ProfilePost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

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
  const [posts, setPosts] = useState<ProfilePost[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (!raw) return;

      const parsed: StoredPost[] = JSON.parse(raw);
      const cleaned = parsed
        .filter((p) => p && p.imageUrl)
        .sort(
          (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
        )
        .map<ProfilePost>((p, index) => ({
          id: p.id ?? `local-${index}`,
          imageUrl: p.imageUrl,
          score: p.score ?? 75,
          createdAt: p.createdAt ?? Date.now(),
        }));

      setPosts(cleaned);
    } catch (err) {
      console.error('Error leyendo publicaciones de perfil:', err);
    }
  }, []);

  const lastScore = posts[0]?.score ?? null;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cabecera perfil */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-800 text-lg font-semibold">
              D
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">David Guirao</h1>
              <p className="text-xs text-neutral-400">
                davidguiraruiz@hotmail.com
              </p>
              <p className="text-xs text-emerald-400">
                Demo de reputación · IA · Perfil personal
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <a
              href="/demo/live"
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 text-center"
            >
              + Subir foto en demo live
            </a>
            <button
              type="button"
              className="rounded-full border border-neutral-700 px-4 py-2 text-xs text-neutral-200 hover:border-emerald-500 hover:text-emerald-400"
            >
              Editar perfil (demo)
            </button>
            {lastScore !== null && (
              <p className="text-[11px] text-neutral-500">
                Último Ethiqia Score de tus publicaciones demo:{' '}
                <span className="text-emerald-400 font-semibold">
                  {lastScore}/100
                </span>
              </p>
            )}
          </div>
        </header>

        {/* Bio */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad. En esta versión
            demo las imágenes se suben desde{' '}
            <span className="font-semibold text-emerald-400">/demo/live</span> y
            se guardan en este navegador como si fueran publicaciones reales. Es
            suficiente para enseñar el flujo completo a inversores y al Parque
            Científico.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Tus publicaciones
            </h2>
            <a
              href="/feed"
              className="text-xs text-emerald-400 hover:underline underline-offset-2"
            >
              Ver en el feed →
            </a>
          </div>

          {posts.length === 0 && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-6 text-sm text-neutral-400">
              Todavía no has subido ninguna foto desde la demo en vivo. Ve a{' '}
              <a
                href="/demo/live"
                className="text-emerald-400 underline underline-offset-2"
              >
                Demo &gt; Live
              </a>{' '}
              y sube tu primera imagen para ver aquí tu bio en marcha.
            </div>
          )}

          {posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
                >
                  <div className="bg-black">
                    <img
                      src={post.imageUrl}
                      alt="Tu publicación"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    <p className="text-xs text-neutral-300">
                      Ethiqia Score demo:{' '}
                      <span className="font-semibold text-emerald-400">
                        {post.score}/100
                      </span>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Subida el {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
