'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/session';
import {
  getDemoFeedPosts,
  deleteDemoFeedPost,
  type DemoFeedPost,
} from '@/lib/feed';

type SessionData = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
};

type LastDemoData = {
  score: number;
  name?: string;
  createdAt?: number;
  imageUrl?: string;
};

const LAST_DEMO_KEY = 'ethiqia_demo_last_post';

export default function ProfilePage() {
  const [session, setSessionState] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<DemoFeedPost[]>([]);
  const [lastDemo, setLastDemo] = useState<LastDemoData | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const s = getSession();
      if (s) setSessionState(s as SessionData);
    } catch {
      // ignore
    }

    setPosts(getDemoFeedPosts());

    try {
      const raw = window.localStorage.getItem(LAST_DEMO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LastDemoData;
        if (parsed.score !== undefined) setLastDemo(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDeletePost = (id: string) => {
    deleteDemoFeedPost(id);
    setPosts(getDemoFeedPosts());
  };

  const userEmail = session?.user?.email ?? 'usuario@demo';
  const userName =
    session?.user?.name ||
    (userEmail ? userEmail.split('@')[0] : 'Usuario Ethiqia');

  const publicaciones = posts.length;
  const ultimoScoreDemo = lastDemo?.score ?? null;

  const ultimaFoto = posts[0] ?? null;
  const otrasFotos = posts.slice(1, 7);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* CABECERA PERFIL */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-lg font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">{userName}</h1>
              <p className="text-xs text-neutral-400">{userEmail}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Perfil demo con publicaciones en este navegador
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => (window.location.href = '/demo/live')}
              className="rounded-full bg-emerald-500 px-4 py-1.5 font-semibold text-black hover:bg-emerald-400"
            >
              + Subir foto en demo live
            </button>
            <p className="text-[11px] text-neutral-500 max-w-[220px] text-right">
              Las fotos que subas desde la demo aparecerán aquí y en el feed.
            </p>
          </div>
        </header>

        {/* RESUMEN */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Publicaciones en esta demo
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {publicaciones}
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Son las imágenes que has subido desde{' '}
              <code className="bg-neutral-800 rounded px-1 py-[1px]">
                /demo/live
              </code>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Último Ethiqia Score (demo)
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {ultimoScoreDemo != null ? `${ultimoScoreDemo}/100` : '—'}
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Calculado al subir la última imagen en la demo.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Estado de la demo
            </p>
            <p className="mt-2 text-sm text-neutral-200">
              Lista para enseñar a inversores: login, bio, feed, explorar y
              subida de imágenes simuladas.
            </p>
          </div>
        </section>

        {/* BIO */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2 text-sm">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-xs text-neutral-400">
            En esta versión alfa, tus imágenes y tu Ethiqia Score se guardan
            solo en este navegador usando almacenamiento local.
          </p>
        </section>

        {/* TUS FOTOS + CUBO DE BASURA */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1.2fr)] items-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
              <a
                href="/feed"
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                Ver en el feed →
              </a>
            </div>

            {!ultimaFoto ? (
              <p className="text-xs text-neutral-400">
                Aún no tienes publicaciones. Sube una imagen desde{' '}
                <span className="text-emerald-400">Demo &gt; Live</span> y se
                mostrará aquí.
              </p>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
                  <img
                    src={ultimaFoto.imageUrl}
                    alt="Tu última publicación"
                    className="w-full max-h-[420px] object-cover"
                  />

                  {/* Botón cubo de basura */}
                  <button
                    type="button"
                    onClick={() => handleDeletePost(ultimaFoto.id)}
                    className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] text-red-300 hover:bg-black hover:text-red-200"
                  >
                    🗑️ Eliminar
                  </button>

                  <div className="border-t border-neutral-900 px-4 py-3 text-xs">
                    <p className="text-neutral-200 font-medium">
                      Tu última publicación analizada por Ethiqia
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Esta imagen se ha subido desde la demo en vivo y se
                      muestra en tu perfil y en el feed.
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Subida el{' '}
                      {new Date(ultimaFoto.createdAt).toLocaleString('es-ES')}.
                    </p>
                  </div>
                </div>

                {otrasFotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-neutral-400">
                      Otras imágenes recientes:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {otrasFotos.map((p) => (
                        <div
                          key={p.id}
                          className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                        >
                          <img
                            src={p.imageUrl}
                            alt="Publicación anterior"
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePost(p.id)}
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-[2px] text-[10px] text-red-300 hover:bg-black hover:text-red-200"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>

            {ultimaFoto ? (
              <>
                <p className="text-xs text-neutral-300">Última publicación:</p>
                <p className="text-[11px] text-neutral-400">
                  {new Date(ultimaFoto.createdAt).toLocaleString('es-ES')}
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-400">
                Aún no hay actividad. Sube tu primera foto en la demo.
              </p>
            )}

            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 space-y-1">
              <p className="text-[11px] text-neutral-400">
                Ethiqia Score (última demo):
              </p>
              <p className="text-sm text-emerald-300">
                {ultimoScoreDemo != null ? `${ultimoScoreDemo}/100` : '—'}
              </p>
              <p className="text-[11px] text-neutral-500">
                Se calcula cuando subes una imagen en{' '}
                <code>/demo/live</code>.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
