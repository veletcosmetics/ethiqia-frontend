'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getSession, type Session } from '@/lib/session';
import {
  type EthiqiaNotification,
  getNotifications,
} from '@/lib/notifications';

type ProfilePost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string | null;
};

type ProfileState = {
  session: Session | null;
  loading: boolean;
  posts: ProfilePost[];
  notifications: EthiqiaNotification[];
  lastDemoScore: number | null;
};

function getTitle(type: string) {
  switch (type) {
    case 'post-scored':
      return 'ETHIQIA SCORE';
    case 'comment-approved':
      return 'COMENTARIO APROBADO';
    case 'comment-blocked':
      return 'COMENTARIO BLOQUEADO';
    default:
      return 'Actividad';
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>({
    session: null,
    loading: true,
    posts: [],
    notifications: [],
    lastDemoScore: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const s = getSession();
        let posts: ProfilePost[] = [];
        let notifications: EthiqiaNotification[] = [];
        let lastDemoScore: number | null = null;

        // Último score de demo
        if (typeof window !== 'undefined') {
          try {
            const raw = window.localStorage.getItem('ethiqia_demo_post');
            if (raw) {
              const parsed = JSON.parse(raw) as { score?: number };
              if (typeof parsed.score === 'number') {
                lastDemoScore = parsed.score;
              }
            }
          } catch {
            // ignore
          }
        }

        // Notificaciones locales
        try {
          notifications = getNotifications();
        } catch {
          notifications = [];
        }

        // Posts reales del usuario
        if (s?.user?.id) {
          const { data, error } = await supabase
            .from('posts')
            .select('id,image_url,caption,created_at,user_id')
            .eq('user_id', s.user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            posts = data as ProfilePost[];
          }
        }

        setState({
          session: s ?? null,
          loading: false,
          posts,
          notifications,
          lastDemoScore,
        });
      } catch (e) {
        console.error(e);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
  }, []);

  const { session, loading, posts, notifications, lastDemoScore } = state;
  const userName = session?.user?.name || 'Tu perfil Ethiqia';
  const userEmail = session?.user?.email || 'ejemplo@correo.com';

  const publicacionesReales = posts.length;
  const ethScoreTexto =
    lastDemoScore != null ? `${lastDemoScore}/100` : '—';

  const lastThreeNotifications = notifications.slice(0, 3);
  const notificationsCount = notifications.length;

  const initials = (userName || 'T')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* CABECERA PERFIL */}
        <header className="flex flex-col gap-4 border-b border-neutral-900 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-lg font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{userName}</h1>
              <p className="text-sm text-neutral-400">{userEmail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  Perfil demo conectado a backend (Supabase)
                </span>
                {/* Indicador de notificaciones arriba */}
                <Link
                  href="/notifications"
                  className="flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
                >
                  🔔 Notificaciones recibidas
                  <span className="rounded-full bg-neutral-800 px-1.5 text-[10px] text-emerald-300">
                    {notificationsCount}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <Link
              href="/demo/live"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
            >
              + Subir foto en demo live
            </Link>
            <p className="text-[11px] text-neutral-500 max-w-xs text-right md:text-right">
              Las fotos que subas desde la demo se guardan en Supabase y
              aparecen aquí y en el feed.
            </p>
          </div>
        </header>

        {/* TARJETAS RESUMEN */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
            <p className="text-xs font-medium text-neutral-400">
              PUBLICACIONES
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {publicacionesReales}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Imágenes subidas desde la demo y guardadas en la base de
              datos real.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
            <p className="text-xs font-medium text-neutral-400">
              ETHIQIA SCORE (demo)
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {ethScoreTexto}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Último score generado al subir una foto en la demo en vivo.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
            <p className="text-xs font-medium text-neutral-400">
              SIGUIENTE FASE
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-100">
              Panel empresa y APIs externas.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Conectar más bloques de score, panel para negocios y
              automatizar reputación Ethiqia Score.
            </p>
          </div>
        </section>

        {/* BIO */}
        <section className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Tu bio
          </h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus
            fotos publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-sm text-neutral-400">
            En esta versión alfa, tus imágenes se guardan ya en Supabase
            como si fueran publicaciones reales. El siguiente paso es
            conectar empresas, APIs externas y más bloques de Ethiqia
            Score.
          </p>
        </section>

        {/* PUBLICACIONES + NOTIFICACIONES (solo 3 últimas) */}
        <section className="grid gap-4 md:grid-cols-[2fr,1fr] items-start">
          {/* Tus publicaciones */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
              <Link
                href="/feed"
                className="text-xs text-emerald-400 hover:underline"
              >
                Ver en el feed →
              </Link>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-neutral-500">
                Cargando publicaciones...
              </p>
            )}

            {!loading && posts.length === 0 && (
              <p className="mt-4 text-sm text-neutral-500">
                Todavía no has subido ninguna foto real desde la demo.
                Sube tu primera imagen desde{' '}
                <Link
                  href="/demo/live"
                  className="text-emerald-400 underline"
                >
                  Demo &gt; Live
                </Link>
                .
              </p>
            )}

            {!loading && posts.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/80"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
                      <img
                        src={post.image_url}
                        alt={post.caption ?? 'Publicación Ethiqia'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                        Publicación real
                      </p>
                      {post.caption && (
                        <p className="text-xs text-neutral-200 line-clamp-2">
                          {post.caption}
                        </p>
                      )}
                      <p className="text-[11px] text-neutral-500">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Notificaciones recientes (solo 3) */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-100">
                Últimas notificaciones
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Solo se muestran las 3 más recientes. Para ver el historial
                completo, entra en la sección de notificaciones.
              </p>

              <ul className="mt-4 space-y-3">
                {lastThreeNotifications.length === 0 && (
                  <p className="text-neutral-500 text-sm">
                    Aún no tienes notificaciones.
                  </p>
                )}

                {lastThreeNotifications.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-100">
                        {getTitle(n.type)}
                      </p>
                      <span className="text-[11px] text-neutral-500">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-neutral-400">{n.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
