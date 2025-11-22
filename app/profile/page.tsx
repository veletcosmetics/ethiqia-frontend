'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/session';

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
};

type Session = {
  user: SessionUser;
};

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

const STORAGE_KEY_DEMO = 'ethiqia_demo_post';
const STORAGE_KEY_FEED = 'ethiqia_feed_posts';

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [demoPost, setDemoPost] = useState<DemoPost | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

  // Cargar sesión (correo / nombre) desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const s = getSession();
      if (s) setSession(s);
    } catch {
      // ignore
    }
  }, []);

  // Cargar última publicación demo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DEMO);
      if (raw) {
        const data = JSON.parse(raw) as DemoPost;
        if (data.imageUrl) setDemoPost(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Cargar posts del feed (reales, sin falsos)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FEED);
      const parsed: FeedPost[] = raw ? JSON.parse(raw) : [];
      setFeedPosts(parsed);
    } catch {
      setFeedPosts([]);
    }
  }, []);

  const email = session?.user.email ?? 'demo@ethiqia.app';
  const displayName = session?.user.name ?? email.split('@')[0] ?? 'Usuario Ethiqia';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera perfil */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{displayName}</h1>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[11px] text-emerald-300">
                  Perfil demo conectado a Supabase
                </span>
              </div>
              <p className="text-sm text-neutral-400">Email: {email}</p>
              <p className="text-xs text-neutral-500">
                En esta versión demo, tu sesión y publicaciones se guardan de forma local
                en este navegador (localStorage).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="/profile"
              className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              Tu bio
            </a>
            <a
              href="/demo/live"
              className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              Subir foto en demo live
            </a>
            <a
              href="/feed"
              className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              Ver en el feed →
            </a>
          </div>
        </header>

        {/* Sección bio */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-sm text-neutral-300 max-w-2xl">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos publicadas
            y la reputación asociada a tu actividad. En esta demo las imágenes y el
            Ethiqia Score se guardan en tu navegador para que puedas enseñar el flujo
            completo a inversores y amigos sin usar un backend real.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Tus publicaciones
            </h2>
            <a
              href="/demo/live"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              + Subir foto en demo live
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Bloque principal: última demo */}
            <article className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
              <div className="relative w-full bg-neutral-900">
                {demoPost?.imageUrl ? (
                  <img
                    src={demoPost.imageUrl}
                    alt="Tu publicación"
                    className="w-full max-h-[420px] object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                    Aún no has subido ninguna imagen desde la demo live.
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-[3px] text-xs text-neutral-100">
                  Tu publicación
                </div>
                {demoPost?.score != null && (
                  <div className="absolute right-3 bottom-3 rounded-full bg-black/70 px-3 py-[3px] text-xs text-emerald-300">
                    Ethiqia Score: {demoPost.score}/100
                  </div>
                )}
              </div>
            </article>

            {/* Columna lateral: mini feed propio */}
            <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-300">
              <p className="font-semibold text-neutral-100">
                Resumen de actividad
              </p>
              {demoPost ? (
                <>
                  <p>
                    Última publicación con{' '}
                    <span className="font-semibold">
                      {demoPost.score}/100 Ethiqia Score
                    </span>
                    .
                  </p>
                  <p className="text-neutral-400">
                    Esta imagen también se muestra en el feed general de la demo
                    (solo fotos reales subidas por usuarios).
                  </p>
                  <a
                    href="/feed"
                    className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mt-1"
                  >
                    Ver en el feed →
                  </a>
                </>
              ) : (
                <p className="text-neutral-400">
                  Sube una foto desde la demo live para ver aquí tu primera
                  publicación y su Ethiqia Score.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Vista rápida de tus posts del feed (si hay varios) */}
        {feedPosts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-100">
                Mosaico de tus fotos reales
              </h2>
              <a
                href="/feed"
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Ver todas en el feed →
              </a>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-[2px] overflow-hidden rounded-xl bg-neutral-900">
              {feedPosts.slice(0, 12).map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square overflow-hidden"
                >
                  <img
                    src={post.imageUrl}
                    alt="Foto del feed"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
