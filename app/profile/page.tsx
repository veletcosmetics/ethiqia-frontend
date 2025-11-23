'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSession, type Session } from '@/lib/session';

type ProfilePost = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string | null;
};

type DemoLocalPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

const LOCAL_DEMO_KEY = 'ethiqia_demo_post';

export default function ProfilePage() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastDemoScore, setLastDemoScore] = useState<number | null>(null);
  const [lastDemoDate, setLastDemoDate] = useState<string | null>(null);

  // Cargar sesión (demo) y último análisis local
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = getSession();
    if (s) setSessionState(s);

    // Último análisis guardado en localStorage por /demo/live
    try {
      const raw = window.localStorage.getItem(LOCAL_DEMO_KEY);
      if (raw) {
        const data = JSON.parse(raw) as DemoLocalPost;
        if (typeof data.score === 'number') {
          setLastDemoScore(data.score);
        }
        if (data.createdAt) {
          const d = new Date(data.createdAt);
          setLastDemoDate(d.toLocaleString());
        }
      }
    } catch {
      // ignoramos errores de parseo
    }
  }, []);

  // Cargar publicaciones reales desde Supabase
  useEffect(() => {
    const loadPosts = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data as ProfilePost[]);
      } else {
        console.error('Error cargando posts de Supabase', error);
      }

      setLoading(false);
    };

    loadPosts();
  }, [session?.user?.id]);

  const latestPost = posts[0] ?? null;
  const totalPosts = posts.length;

  const displayName =
    session?.user?.name ||
    (session?.user?.email
      ? session.user.email.split('@')[0]
      : 'Usuario demo');

  const avatarInitial =
    displayName && displayName.length > 0
      ? displayName.charAt(0).toUpperCase()
      : 'E';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* CABECERA PERFIL */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-2xl font-semibold text-emerald-400 border border-emerald-500/40">
              {avatarInitial}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{displayName}</h1>
              {session?.user?.email && (
                <p className="text-sm text-neutral-400">
                  {session.user.email}
                </p>
              )}
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                ● Perfil demo conectado a Supabase
              </span>
            </div>
          </div>

          {/* Resumen arriba a la derecha */}
          <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              <p className="text-neutral-400">Publicaciones reales</p>
              <p className="mt-1 text-lg font-semibold text-neutral-50">
                {totalPosts}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Guardadas en la tabla <code>posts</code> de Supabase.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              <p className="text-neutral-400">Último Ethiqia Score (demo)</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {lastDemoScore != null ? `${lastDemoScore}/100` : '—'}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Guardado localmente desde <code>/demo/live</code>.
              </p>
            </div>
          </div>
        </header>

        {/* BIO + PUBLICACIONES */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Columna izquierda */}
          <div className="space-y-4">
            {/* Tarjeta Bio */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tu bio
              </h2>
              <p className="text-sm text-neutral-300">
                Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus
                fotos publicadas y la reputación asociada a tu actividad.
              </p>
              <p className="text-xs text-neutral-500">
                En esta demo las imágenes se suben desde{' '}
                <code>/demo/live</code> y se guardan como publicaciones reales
                en Supabase en la tabla <code>posts</code>. En la versión
                completa podrás personalizar tu biografía, enlaces y más datos
                de perfil.
              </p>

              {/* Sobre mí (demo, editable localmente en el futuro) */}
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 space-y-1">
                <p className="text-xs font-medium text-neutral-300">
                  Sobre mí (demo)
                </p>
                <p className="text-xs text-neutral-400">
                  Aquí podrías contar a inversores o amigos quién eres, a qué se
                  dedica tu proyecto y por qué tu reputación en Ethiqia importa.
                  En la versión real este texto sería editable desde tu perfil.
                </p>
              </div>
            </section>

            {/* Tus publicaciones */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Tus publicaciones
                </h2>
                <a
                  href="/demo/live"
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                >
                  + Subir foto en demo live
                </a>
              </div>

              {loading && (
                <p className="text-xs text-neutral-400">
                  Cargando publicaciones reales…
                </p>
              )}

              {!loading && !latestPost && (
                <p className="text-xs text-neutral-400">
                  Todavía no has subido ninguna foto desde la demo en vivo.
                  Ve a <span className="font-medium">Demo &gt; Live</span> y
                  sube tu primera imagen.
                </p>
              )}

              {latestPost && (
                <>
                  {/* Publicación principal */}
                  <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
                    {latestPost.image_url ? (
                      <img
                        src={latestPost.image_url}
                        alt={latestPost.caption || 'Tu publicación'}
                        className="w-full max-h-[420px] object-cover"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                        Publicación sin imagen.
                      </div>
                    )}
                    <div className="border-t border-neutral-900 px-4 py-3 text-xs space-y-1">
                      <p className="font-medium text-neutral-100">
                        Tu última publicación analizada por Ethiqia
                      </p>
                      <p className="text-neutral-400">
                        {latestPost.caption ||
                          'Imagen subida desde la demo en vivo.'}
                      </p>
                      {latestPost.created_at && (
                        <p className="text-[11px] text-neutral-500">
                          Publicada el{' '}
                          {new Date(
                            latestPost.created_at
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mosaicito pequeño si hubiera más posts */}
                  {posts.length > 1 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-[11px] text-neutral-400">
                        Otras fotos reales subidas a la demo:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {posts.slice(1, 7).map((p) => (
                          <div
                            key={p.id}
                            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                          >
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.caption || 'Publicación'}
                                className="h-24 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-24 items-center justify-center text-[11px] text-neutral-500">
                                Sin imagen
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Columna derecha: actividad y redes */}
          <div className="space-y-4">
            {/* Resumen de actividad */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-neutral-100">
                Resumen de actividad
              </h2>
              {latestPost ? (
                <>
                  <p className="text-xs text-neutral-400">
                    Última publicación guardada en Supabase:
                  </p>
                  <p className="text-xs text-neutral-300">
                    {latestPost.created_at
                      ? new Date(
                          latestPost.created_at
                        ).toLocaleString()
                      : 'Fecha no disponible'}
                  </p>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    Esta imagen se ha subido desde la demo en vivo y se muestra
                    tanto aquí como en el feed general de la demo. En la versión
                    de producción el Ethiqia Score real se calcularía en el
                    backend.
                  </p>
                </>
              ) : (
                <p className="text-xs text-neutral-400">
                  Aún no hay actividad real. Sube una foto desde la demo en vivo
                  para ver aquí tu historial.
                </p>
              )}

              {/* Bloque Ethiqia Score con barra */}
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300">
                    Último Ethiqia Score (demo)
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {lastDemoScore != null ? `${lastDemoScore}/100` : '—'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        lastDemoScore != null ? lastDemoScore : 0
                      }%`,
                    }}
                  />
                </div>
                {lastDemoDate && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Último análisis registrado el {lastDemoDate}.
                  </p>
                )}
              </div>
            </section>

            {/* Redes sociales / enlaces (demo) */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                Presencia pública (demo)
              </h2>
              <p className="text-xs text-neutral-400">
                Aquí podrías enlazar otras redes (LinkedIn, Instagram, web,
                etc.) para enseñar cómo Ethiqia podría cruzar tu actividad
                pública con tu reputación verificada.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="rounded-full border border-neutral-700 bg-neutral-950/60 px-3 py-1 text-[11px] text-neutral-300 hover:border-emerald-400 hover:text-emerald-300">
                  LinkedIn (demo)
                </button>
                <button className="rounded-full border border-neutral-700 bg-neutral-950/60 px-3 py-1 text-[11px] text-neutral-300 hover:border-emerald-400 hover:text-emerald-300">
                  Instagram (demo)
                </button>
                <button className="rounded-full border border-neutral-700 bg-neutral-950/60 px-3 py-1 text-[11px] text-neutral-300 hover:border-emerald-400 hover:text-emerald-300">
                  Web / portfolio (demo)
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
