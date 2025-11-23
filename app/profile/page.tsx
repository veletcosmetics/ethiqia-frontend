'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/session';

type SessionData = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
};

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

type LastDemoData = {
  score: number;
  name?: string;
  createdAt?: number;
};

const FEED_STORAGE_KEY = 'ethiqia_feed_posts';
const DEMO_STORAGE_KEY = 'ethiqia_demo_post';

export default function ProfilePage() {
  const [session, setSessionState] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [lastDemo, setLastDemo] = useState<LastDemoData | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sesión demo
    try {
      const s = getSession();
      if (s) {
        setSessionState(s as SessionData);
      }
    } catch {
      // ignore
    }

    // Posts del feed (local demo)
    try {
      const raw = window.localStorage.getItem(FEED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FeedPost[];
        setPosts(parsed);
      }
    } catch {
      setPosts([]);
    }

    // Último análisis demo
    try {
      const rawDemo = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (rawDemo) {
        const parsed = JSON.parse(rawDemo) as LastDemoData;
        if (parsed.score !== undefined) {
          setLastDemo(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
                Perfil demo con publicaciones reales en tu navegador
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
              Se basan en las fotos que se han subido desde{' '}
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
              Calculado de forma simulada al subir tu última imagen.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Estado de la demo
            </p>
            <p className="mt-2 text-sm text-neutral-200">
              Demo preparada para enseñar a inversores: sesión, bio, feed,
              exploración y subida de imágenes simuladas.
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
            solo en este navegador usando almacenamiento local. Es suficiente
            para demostrar el concepto a inversores y al Parque Científico.
          </p>
        </section>

        {/* TUS FOTOS */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1.2fr)] items-start">
          {/* Principal */}
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
                <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
                  <img
                    src={ultimaFoto.imageUrl}
                    alt="Tu última publicación"
                    className="w-full max-h-[420px] object-cover"
                  />
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
                          className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                        >
                          <img
                            src={p.imageUrl}
                            alt="Publicación anterior"
                            className="h-24 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info lateral */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>
            {ultimaFoto ? (
              <>
                <p className="text-xs text-neutral-300">
                  Última publicación:
                </p>
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
                Este valor se calcula de forma simulada cuando subes una imagen
                en <code>/demo/live</code>.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
