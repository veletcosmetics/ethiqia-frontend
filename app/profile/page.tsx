'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import NotificationsBar from '../../components/demo/NotificationsBar';
import {
  DemoPost,
  loadDemoPosts,
  loadLastPost,
} from '../../lib/demoStorage';

export default function ProfilePage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);
  const [lastPost, setLastPost] = useState<DemoPost | null>(null);

  useEffect(() => {
    setPosts(loadDemoPosts());
    setLastPost(loadLastPost());
  }, []);

  const total = posts.length;
  const lastScore = lastPost ? lastPost.score : null;
  const lastDate = lastPost
    ? new Date(lastPost.createdAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <NotificationsBar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        {/* Cabecera perfil */}
        <section className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold">
              D
            </div>
            <div>
              <h1 className="text-xl font-semibold">David Guirao (demo)</h1>
              <p className="text-xs text-slate-400">
                Demo local de Ethiqia · sin backend · solo en este navegador.
              </p>
            </div>
          </div>

          <button className="rounded-full border border-slate-600 px-4 py-1.5 text-xs text-slate-200 hover:border-emerald-400 hover:text-emerald-300">
            Editar perfil (demo visual)
          </button>
        </section>

        {/* Bloques bio + resumen */}
        <section className="mb-8 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              Tu bio
            </h2>
            <p className="text-xs leading-relaxed text-slate-400">
              Este es tu espacio personal en Ethiqia. En esta versión demo, las
              fotos que subes desde{' '}
              <span className="text-emerald-300">/demo/live</span> se guardan en{' '}
              <code className="rounded bg-black/50 px-1">localStorage</code> y se
              muestran aquí como si fueran publicaciones reales.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-xs">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Resumen rápido
            </h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Publicaciones locales</span>
                <span className="font-semibold text-slate-100">{total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Último Ethiqia Score</span>
                <span className="font-semibold text-emerald-300">
                  {lastScore !== null ? `${lastScore}/100` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Última publicación</span>
                <span className="text-[11px] text-slate-300">
                  {lastDate ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Título + botón a demo/live */}
        <section className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Tus publicaciones
          </h2>
          <button
            onClick={() => {
              window.location.href = '/demo/live';
            }}
            className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
          >
            Subir nueva imagen (demo Live)
          </button>
        </section>

        {/* Listado de publicaciones */}
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">
            Aún no has publicado nada en esta demo. Ve a{' '}
            <span className="text-emerald-300">/demo/live</span> y sube tu
            primera imagen.
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
              >
                <div className="relative h-64 w-full">
                  <Image
                    src={post.imageUrl}
                    alt="Publicación de tu bio"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    {post.score}/100 · Ethiqia Score
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-[11px] text-slate-400">
                  <span>Demo reputación · IA</span>
                  <span>
                    {new Date(post.createdAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
