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
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string | null;
};

const PLACEHOLDERS = [
  '/demo/profile-stock.jpg',
  '/demo/profile-stock.jpg',
  '/demo/profile-stock.jpg',
  '/demo/profile-stock.jpg',
  '/demo/profile-stock.jpg',
  '/demo/profile-stock.jpg',
];

export default function ProfilePage() {
  const [session, setSessionState] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = getSession();
    if (s) setSessionState(s as SessionData);

    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase.from('posts').select('*').order('created_at', {
        ascending: false,
      });

      if (s?.user?.id) {
        query = query.eq('user_id', s.user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al cargar posts para perfil:', error);
        setPosts([]);
      } else {
        setPosts((data || []) as ProfilePost[]);
      }

      setLoading(false);
    };

    fetchPosts();
  }, []);

  const userEmail = session?.user?.email ?? 'usuario@demo';
  const userName =
    session?.user?.name ||
    (userEmail ? userEmail.split('@')[0] : 'Usuario Ethiqia');

  const publicaciones = posts.length;
  const ultimaFoto = posts[0] ?? null;
  const otrasFotos = posts.slice(1, 7);

  const gridImages: string[] =
    posts.length > 0
      ? posts.map((p) => p.image_url).slice(0, 6)
      : PLACEHOLDERS.slice(0, 6);

  const handleGoToDemoLive = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/demo/live';
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* CABECERA PERFIL */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-xl font-semibold overflow-hidden">
              {ultimaFoto ? (
                <img
                  src={ultimaFoto.image_url}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">{userName}</h1>
              <p className="text-xs text-neutral-400">{userEmail}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Perfil demo conectado a backend (Supabase)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs">
            <button
              type="button"
              onClick={handleGoToDemoLive}
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
              Publicaciones
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {publicaciones}
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Imágenes subidas desde la demo y guardadas en la base de datos
              real.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Estado
            </p>
            <p className="mt-2 text-sm text-neutral-200">
              Demo lista para enseñar a inversores: login, bio, feed y subida de
              imágenes reales.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.17em] text-neutral-500">
              Siguiente fase
            </p>
            <p className="mt-2 text-sm text-neutral-200">
              Conectar más bloques de score, panel empresa y APIs externas.
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
            En esta versión alfa, tus imágenes se guardan ya en Supabase como si
            fueran publicaciones reales.
          </p>
        </section>

        {/* FOTOS + CUADRÍCULA */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,_2.1fr)_minmax(0,_1.2fr)] items-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
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

            {/* Cuadrícula tipo Instagram */}
            <div className="grid grid-cols-3 gap-[3px] rounded-xl overflow-hidden bg-neutral-900">
              {gridImages.map((src, idx) => (
                <div key={idx} className="relative aspect-square bg-neutral-800">
                  <img
                    src={src}
                    alt="Publicación"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Publicación destacada */}
            {!ultimaFoto ? (
              <p className="text-xs text-neutral-400 mt-2">
                Aún no tienes publicaciones. Sube una imagen desde{' '}
                <span className="text-emerald-400">Demo &gt; Live</span> y se
                mostrará aquí y en el feed.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 mt-2">
                <img
                  src={ultimaFoto.image_url}
                  alt="Tu última publicación"
                  className="w-full max-h-[420px] object-cover"
                />
                <div className="border-t border-neutral-900 px-4 py-3 text-xs">
                  <p className="text-neutral-200 font-medium">
                    Tu última publicación
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Subida desde la demo y registrada en el backend real.
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {new Date(ultimaFoto.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}

            {otrasFotos.length > 0 && (
              <div className="space-y-2 mt-2">
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
                        src={p.image_url}
                        alt="Publicación anterior"
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LATERAL */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>

            {loading && (
              <p className="text-[11px] text-neutral-400">
                Cargando publicaciones…
              </p>
            )}

            {!loading && !ultimaFoto && (
              <p className="text-[11px] text-neutral-400">
                Aún no hay actividad. Sube tu primera foto en la demo.
              </p>
            )}

            {!loading && ultimaFoto && (
              <>
                <p className="text-xs text-neutral-300">Última publicación:</p>
                <p className="text-[11px] text-neutral-400">
                  {new Date(ultimaFoto.created_at).toLocaleString('es-ES')}
                </p>
              </>
            )}

            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 space-y-1">
              <p className="text-[11px] text-neutral-400">
                Demo conectada a Supabase:
              </p>
              <p className="text-[11px] text-neutral-300">
                Las publicaciones del feed y tu perfil están leyendo de la tabla{' '}
                <code>posts</code>. Es el mismo backend que se puede escalar a
                empresas reales.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
