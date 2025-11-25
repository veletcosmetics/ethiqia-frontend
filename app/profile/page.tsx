// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSession, type Session } from '@/lib/session';
import {
  getNotifications,
  type EthiqiaNotification,
} from '@/lib/notifications';

type LocalDemoPost = {
  id: string;
  imageUrl: string;
  score?: number;
  createdAt?: number;
};

type DemoPostStorage = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

const FEED_STORAGE_KEY = 'ethiqia_feed_posts';
const DEMO_STORAGE_KEY = 'ethiqia_demo_post';

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<LocalDemoPost[]>([]);
  const [lastDemoScore, setLastDemoScore] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<EthiqiaNotification[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sesión demo
    try {
      const s = getSession();
      if (s) setSession(s);
    } catch {
      // ignoramos errores
    }

    // Tus publicaciones (solo las del navegador actual)
    try {
      const rawFeed = window.localStorage.getItem(FEED_STORAGE_KEY);
      if (rawFeed) {
        const parsed = JSON.parse(rawFeed) as LocalDemoPost[];
        const cleaned = parsed
          .filter((p) => p.imageUrl)
          .sort(
            (a, b) =>
              (b.createdAt ?? 0) - (a.createdAt ?? 0)
          );
        setPosts(cleaned);
      }
    } catch {
      // ignoramos errores
    }

    // Último análisis de demo
    try {
      const rawDemo = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (rawDemo) {
        const parsed = JSON.parse(rawDemo) as DemoPostStorage;
        if (typeof parsed.score === 'number') {
          setLastDemoScore(parsed.score);
        }
      }
    } catch {
      // ignoramos errores
    }

    // Notificaciones
    try {
      const notifs = getNotifications();
      setNotifications(notifs);
    } catch {
      // ignoramos errores
    }
  }, []);

  const email = session?.user?.email ?? 'davidguiraruiz@hotmail.com';

  const lastPost = posts[0];
  const lastPostDate =
    lastPost?.createdAt != null
      ? new Date(lastPost.createdAt).toLocaleString()
      : null;

  const recentNotifications = notifications.slice(0, 4);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Cabecera */}
        <header className="flex flex-col gap-4 border-b border-neutral-900 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-semibold">
              D
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">David Guirao</h1>
              <p className="text-sm text-neutral-400">{email}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 border border-emerald-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Perfil demo conectado a backend (Supabase)
              </span>
            </div>
          </div>

          <button
            type="button"
            className="self-start rounded-full border border-neutral-700 px-4 py-2 text-xs text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
          >
            Editar perfil (próximamente)
          </button>
        </header>

        {/* Métricas rápidas */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.16em]">
              Publicaciones
            </h2>
            <p className="mt-2 text-2xl font-semibold text-neutral-50">
              {posts.length}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Imágenes subidas desde la demo y guardadas en la base de datos
              real.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.16em]">
              Estado
            </h2>
            <p className="mt-2 text-sm text-neutral-50">
              Demo lista para enseñar a inversores: login, bio, feed y subida
              de imágenes reales.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Todo lo que ves aquí se puede conectar a un backend real con
              usuarios y empresas.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.16em]">
              Siguiente fase
            </h2>
            <p className="mt-2 text-sm text-neutral-50">
              Conectar más bloques de score, panel empresa y APIs externas.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Esta demo ya sirve como MVP para Parque Científico y primeros
              partners.
            </p>
          </div>
        </section>

        {/* Bio + publicaciones + resumen */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Columna principal */}
          <div className="space-y-4">
            {/* Bio */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-100 mb-1">
                Tu bio
              </h2>
              <p className="text-sm text-neutral-300">
                Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus
                fotos publicadas y la reputación asociada a tu actividad.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                En esta versión alfa, tus imágenes se guardan ya en Supabase
                como si fueran publicaciones reales, pero el perfil es solo de
                ejemplo para la demo.
              </p>
            </div>

            {/* Tus publicaciones (solo las tuyas) */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Tus publicaciones
                </h2>
                <a
                  href="/feed"
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Ver en el feed →
                </a>
              </div>

              {posts.length === 0 && (
                <p className="text-xs text-neutral-400">
                  Todavía no has subido ninguna foto desde la demo en vivo. Ve a{' '}
                  <span className="text-emerald-400">Demo &gt; Live</span> y
                  sube tu primera imagen.
                </p>
              )}

              {posts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                    >
                      <img
                        src={post.imageUrl}
                        alt="Tu publicación"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral: Resumen + notificaciones */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-neutral-100">
                Resumen de actividad
              </h2>

              {lastPostDate ? (
                <p className="text-xs text-neutral-400">
                  Última publicación subida en la demo:{' '}
                  <span className="text-neutral-200">{lastPostDate}</span>
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  Aún no hay actividad real. Sube una foto desde la demo para
                  ver aquí tu historial.
                </p>
              )}

              <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs">
                <p className="text-neutral-400">Ethiqia Score (última demo)</p>
                <p className="mt-1 text-lg font-semibold text-emerald-400">
                  {lastDemoScore != null ? `${lastDemoScore}/100` : '—'}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Score calculado en la demo en vivo. Las penalizaciones por
                  comentarios bloqueados se muestran abajo como actividad.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-neutral-300">
                  Notificaciones recientes
                </h3>

                {recentNotifications.length === 0 && (
                  <p className="text-[11px] text-neutral-500">
                    Aún no hay notificaciones. Cuando publiques fotos o la IA
                    bloquee un comentario, verás los avisos aquí.
                  </p>
                )}

                {recentNotifications.length > 0 && (
                  <ul className="space-y-2 text-[11px]">
                    {recentNotifications.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2"
                      >
                        <p className="font-medium text-neutral-100">
                          {n.title}
                        </p>
                        <p className="text-neutral-400">{n.message}</p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
