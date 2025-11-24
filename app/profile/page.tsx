// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

type ProfilePost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión demo (localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const s = getSession();
      if (s) setSessionData(s);
    } catch {
      // ignorar
    }
  }, []);

  // Cargar posts reales desde Supabase
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(
          data.map((p: any) => ({
            id: p.id,
            image_url: p.image_url,
            caption: p.caption ?? null,
            created_at: p.created_at ?? null,
          }))
        );
      }
      setIsLoading(false);
    };

    loadPosts();
  }, []);

  const publicationsCount = posts.length;

  const userEmail: string =
    sessionData?.user?.email ?? 'demo@ethiqia.app';
  const userName: string =
    sessionData?.user?.name ?? 'Demo User';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera de perfil */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-lg font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{userName}</h1>
              <p className="text-xs text-neutral-400">{userEmail}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                ● Perfil demo conectado a backend (Supabase)
              </span>
            </div>
          </div>

          {/* 🔘 Botón para ir a la demo en vivo */}
          <div className="flex justify-end">
            <Link
              href="/demo/live"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400 transition-colors"
            >
              + Subir foto en demo live
            </Link>
          </div>
        </header>

        {/* Tarjetas de resumen */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Publicaciones
            </p>
            <p className="mt-2 text-3xl font-semibold text-neutral-50">
              {publicationsCount}
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Imágenes subidas desde la demo y guardadas en la base de datos real
              (tabla <code className="bg-neutral-800 px-1 py-[1px] rounded">posts</code>).
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Estado
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-100">
              Demo lista para enseñar a inversores.
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Login, bio, feed y subida de imágenes reales funcionando sobre Supabase.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Siguiente fase
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-100">
              Más bloques de score y APIs externas.
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Conectar panel empresa, puntuaciones avanzadas y moderación externa
              cuando tengamos feedback del Parque Científico.
            </p>
          </div>
        </section>

        {/* Tu bio */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-xs text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-xs text-neutral-500">
            En esta versión alfa, tus imágenes se guardan ya en Supabase como si
            fueran publicaciones reales. El feed y este perfil leen directamente
            de la tabla <code className="bg-neutral-800 px-1 py-[1px] rounded">posts</code>.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
              <Link
                href="/feed"
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                Ver en el feed →
              </Link>
            </div>

            {isLoading && (
              <p className="text-xs text-neutral-500">
                Cargando publicaciones reales desde Supabase…
              </p>
            )}

            {!isLoading && posts.length === 0 && (
              <p className="text-xs text-neutral-500">
                Todavía no has subido ninguna foto desde la demo en vivo.
                Pulsa en <span className="font-medium">“Subir foto en demo live”</span> para
                añadir tu primera imagen.
              </p>
            )}

            {!isLoading && posts.length > 0 && (
              <div className="space-y-4">
                {posts.slice(0, 4).map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950"
                  >
                    <div className="bg-neutral-950">
                      {/* Las imágenes son dataURL, así que las mostramos tal cual */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url}
                        alt={post.caption ?? 'Publicación Ethiqia'}
                        className="w-full max-h-[320px] object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs text-neutral-200">
                        {post.caption ?? 'Publicación subida desde la demo en vivo.'}
                      </p>
                      {post.created_at && (
                        <p className="text-[11px] text-neutral-500">
                          {new Date(post.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
                {posts.length > 4 && (
                  <p className="text-[11px] text-neutral-500">
                    Tienes más publicaciones en el feed general.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Resumen de actividad */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3 text-xs text-neutral-300">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>
            {posts.length === 0 ? (
              <p className="text-neutral-400">
                Aún no hay actividad real. Sube una foto desde la demo en vivo
                para ver aquí tu historial.
              </p>
            ) : (
              <>
                <p>
                  Última publicación guardada en Supabase:{' '}
                  <span className="font-medium">
                    {posts[0].created_at
                      ? new Date(posts[0].created_at).toLocaleString()
                      : 'fecha desconocida'}
                  </span>
                  .
                </p>
                <p className="text-neutral-400">
                  Esta imagen se muestra tanto aquí como en el feed general de la demo.
                </p>
              </>
            )}

            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-[11px] text-neutral-400">
              <p className="font-semibold text-neutral-200 mb-1">
                Demo conectada a Supabase
              </p>
              <p>
                Las publicaciones del feed y tu perfil están leyendo de la tabla{' '}
                <code className="bg-neutral-800 px-1 py-[1px] rounded">posts</code>. Es el
                mismo backend que se puede escalar a empresas reales.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
