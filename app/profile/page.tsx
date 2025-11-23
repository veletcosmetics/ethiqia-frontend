'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSession, clearSession } from '@/lib/session';

type Post = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const [session, setSessionState] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = getSession();
    if (s) setSessionState(s);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando posts del usuario', error);
        setPosts([]);
      } else {
        setPosts((data || []) as Post[]);
      }
      setLoadingPosts(false);
    };

    load();
  }, [session?.user?.id]);

  const email = session?.user?.email as string | undefined;
  const displayName =
    session?.user?.name ||
    (email ? email.split('@')[0] : 'Usuario Ethiqia demo');

  const handleLogout = async () => {
    clearSession();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const lastPost = posts[0];
  const mosaicPosts = posts.slice(0, 6);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Cabecera */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">{displayName}</h1>
              {email && (
                <p className="text-xs text-neutral-400">Email: {email}</p>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[2px] text-[11px] text-emerald-300">
                Perfil demo conectado a Supabase
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = '/demo/live')}
              className="rounded-full border border-emerald-500/60 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
            >
              Subir foto en demo live
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Bio */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-xs text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad. En esta demo las
            imágenes se guardan en Supabase para enseñar el flujo completo a
            inversores y amigos.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
              <button
                onClick={() => (window.location.href = '/feed')}
                className="text-[11px] text-emerald-300 hover:underline"
              >
                Ver en el feed →
              </button>
            </div>

            {loadingPosts && (
              <p className="text-xs text-neutral-400">
                Cargando tus publicaciones…
              </p>
            )}

            {!loadingPosts && !lastPost && (
              <p className="text-xs text-neutral-400">
                Aún no has subido ninguna foto. Sube una desde la demo en vivo.
              </p>
            )}

            {lastPost && (
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black/40">
                <img
                  src={lastPost.image_url}
                  alt={lastPost.caption || 'Tu publicación'}
                  className="w-full max-h-[320px] object-cover"
                />
                <div className="border-t border-neutral-800 px-3 py-2 text-xs space-y-1">
                  <p className="font-medium text-neutral-100">
                    Última publicación
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Guardada en Supabase y visible en el feed general de la
                    demo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen / CTA */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>
            {lastPost ? (
              <>
                <p className="text-neutral-300">
                  Tu última publicación ya está conectada con el feed real de la
                  demo.
                </p>
                <p className="text-neutral-400">
                  Esta imagen también se muestra en el feed general solo para
                  fotos reales subidas por usuarios.
                </p>
              </>
            ) : (
              <p className="text-neutral-400">
                Cuando subas tus primeras fotos, aquí verás un resumen rápido de
                tu actividad.
              </p>
            )}
          </div>
        </section>

        {/* Mosaico */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Mosaico de tus fotos reales
            </h2>
            <button
              onClick={() => (window.location.href = '/feed')}
              className="text-[11px] text-emerald-300 hover:underline"
            >
              Ver todas en el feed →
            </button>
          </div>

          {mosaicPosts.length === 0 && !loadingPosts && (
            <p className="text-xs text-neutral-400">
              Cuando subas varias fotos, aquí aparecerá un mosaico tipo
              Instagram con tus publicaciones.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {mosaicPosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || 'Foto del mosaico'}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
