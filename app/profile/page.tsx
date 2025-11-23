'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

type SessionData = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
};

type ProfilePost = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string | null;
};

type LastDemoData = {
  score: number;
  name?: string;
  createdAt?: number;
};

const DEMO_STORAGE_KEY = 'ethiqia_demo_post';

export default function ProfilePage() {
  const [session, setSessionState] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [lastDemo, setLastDemo] = useState<LastDemoData | null>(null);

  // 1) Recuperar sesión guardada en localStorage (demo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = getSession();
    if (s) {
      // s ya tiene forma { user: { id, email, name } }
      setSessionState(s as SessionData);
    }

    // Último análisis de demo (/demo/live)
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { score?: number; name?: string; createdAt?: number };
        if (parsed.score !== undefined) {
          setLastDemo({
            score: parsed.score,
            name: parsed.name,
            createdAt: parsed.createdAt,
          });
        }
      } catch {
        // ignoramos errores
      }
    }
  }, []);

  // 2) Cargar publicaciones reales desde Supabase (tabla posts)
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoadingPosts(true);

      const userId = session?.user?.id;
      if (!userId) {
        setPosts([]);
        setIsLoadingPosts(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando posts del perfil:', error);
        setPosts([]);
      } else {
        setPosts((data ?? []) as ProfilePost[]);
      }

      setIsLoadingPosts(false);
    };

    // Solo cargar cuando tengamos sesión
    if (session?.user?.id) {
      loadPosts();
    }
  }, [session?.user?.id]);

  const userEmail = session?.user?.email ?? 'usuario@demo';
  const userName =
    session?.user?.name ||
    (userEmail ? userEmail.split('@')[0] : 'Usuario Ethiqia');

  const publicacionesReales = posts.length;
  const ultimoScoreDemo = lastDemo?.score ?? 87; // fallback para que no se vea vacío

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* CABECERA PERFIL */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar simple con iniciales */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-lg font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">{userName}</h1>
              <p className="text-xs text-neutral-400">{userEmail}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Perfil demo conectado a Supabase
              </div>
            </div>
          </div>

          {/* Botones (visual, todavía sin lógica de editar) */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:border-neutral-500"
            >
              Tu bio
            </button>
            <button
              type="button"
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-200 hover:border-neutral-500"
            >
              Editar perfil (próximamente)
            </button>
          </div>
        </header>

        {/* RESUMEN RÁPIDO */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Publicaciones reales guardadas
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {publicacionesReales}
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Imágenes que se han subido desde la demo en vivo y se han
              guardado como posts reales en Supabase.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Ethiqia Score (última demo)
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {ultimoScoreDemo}/100
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Último análisis simulado realizado desde <code>/demo/live</code>.
              Se guarda solo en tu navegador.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Estado de la demo
            </p>
            <p className="mt-2 text-sm text-neutral-200">
              Esta versión está pensada para enseñar el flujo a inversores y
              amigos: sesión, bio, publicaciones reales y feed sin perfiles
              falsos.
            </p>
          </div>
        </section>

        {/* BIO EXPLICATIVA */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-sm space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-xs text-neutral-400">
            En esta demo las imágenes se suben desde{' '}
            <code className="rounded bg-neutral-800 px-1 py-[1px] text-[11px]">
              /demo/live
            </code>{' '}
            y se guardan como publicaciones reales en Supabase en la tabla{' '}
            <code className="rounded bg-neutral-800 px-1 py-[1px] text-[11px]">
              posts
            </code>
            .
          </p>
        </section>

        {/* TUS PUBLICACIONES */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,_2fr)_minmax(0,_1.2fr)] items-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
              <a
                href="/demo/live"
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                + Subir foto en demo live
              </a>
            </div>

            {isLoadingPosts ? (
              <p className="text-xs text-neutral-400">
                Cargando tus publicaciones reales…
              </p>
            ) : posts.length === 0 ? (
              <p className="text-xs text-neutral-400">
                Todavía no has subido ninguna foto desde la demo en vivo. Ve a{' '}
                <a href="/demo/live" className="text-emerald-400">
                  Demo &gt; Live
                </a>{' '}
                y sube tu primera imagen.
              </p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950"
                  >
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.caption ?? 'Tu publicación'}
                        className="w-full max-h-[420px] object-cover"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                        Imagen sin vista previa
                      </div>
                    )}
                    <div className="border-t border-neutral-900 px-4 py-3 text-xs">
                      <p className="text-neutral-200">
                        {post.caption || 'Publicación analizada por Ethiqia.'}
                      </p>
                      {post.created_at && (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Subida el{' '}
                          {new Date(post.created_at).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* RESUMEN DE ACTIVIDAD */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>

            {posts.length === 0 ? (
              <p className="text-xs text-neutral-400">
                Aún no hay actividad real. Sube una foto desde la demo en vivo
                para ver aquí tu historial.
              </p>
            ) : (
              <>
                <p className="text-xs text-neutral-300">
                  Última publicación guardada en Supabase:
                </p>
                <p className="text-[11px] text-neutral-400">
                  {posts[0].created_at
                    ? new Date(posts[0].created_at).toLocaleString('es-ES')
                    : 'Fecha desconocida'}
                </p>
              </>
            )}

            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
              <p className="text-[11px] text-neutral-400">
                Último análisis de la demo:
              </p>
              <p className="mt-1 text-sm text-emerald-300">
                Ethiqia Score: {ultimoScoreDemo}/100
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Guardado localmente en este navegador para la demo.
              </p>
            </div>

            <a
              href="/feed"
              className="inline-flex items-center text-[11px] text-emerald-400 hover:text-emerald-300 mt-2"
            >
              Ver publicaciones reales en el feed →
            </a>
          </aside>
        </section>
      </section>
    </main>
  );
}
