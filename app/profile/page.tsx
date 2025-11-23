'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

type PostRow = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
};

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

const DEMO_STORAGE_KEY = 'ethiqia_demo_post';

export default function ProfilePage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoPost, setDemoPost] = useState<DemoPost | null>(null);
  const [email, setEmail] = useState<string>('demo@ethiqia.app');

  // Cargar sesión demo (solo para mostrar email) + último score local
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = getSession();
    if (s?.user?.email) {
      setEmail(s.user.email);
    }

    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as DemoPost;
        setDemoPost(data);
      } catch {
        // ignore
      }
    }
  }, []);

  // Cargar publicaciones reales desde Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error cargando posts de Supabase:', error);
          setError('No se han podido cargar tus publicaciones reales.');
        } else {
          setPosts(data || []);
        }
      } catch (e) {
        console.error(e);
        setError('No se han podido cargar tus publicaciones reales.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const lastPost = posts[0] || null;
  const ethScore = demoPost?.score ?? 0;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera del perfil */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-semibold">
              {email.charAt(0)?.toUpperCase() ?? 'E'}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">
                {email.split('@')[0] || 'Tu perfil'}
              </h1>
              <p className="text-xs text-neutral-400">{email}</p>
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                Perfil demo conectado a Supabase
              </span>
            </div>
          </div>

          <div className="text-right space-y-1 text-xs text-neutral-400">
            <p>
              Publicaciones reales guardadas:{' '}
              <span className="text-neutral-100 font-medium">
                {posts.length}
              </span>
            </p>
            <p>
              Ethiqia Score (última demo):{' '}
              <span className="text-emerald-400 font-semibold">
                {ethScore}/100
              </span>
            </p>
          </div>
        </header>

        {/* Bio explicativa */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p>
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus
            fotos publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-neutral-400 text-xs">
            En esta demo las imágenes se suben desde{' '}
            <code className="bg-neutral-800 px-1 py-[1px] rounded">
              /demo/live
            </code>{' '}
            y se guardan como publicaciones reales en Supabase en la tabla{' '}
            <code className="bg-neutral-800 px-1 py-[1px] rounded">posts</code>.
          </p>
        </section>

        {/* Bloque principal: últimas publicaciones + resumen */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
          {/* Tus publicaciones */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-100">
                Tus publicaciones
              </h2>
            </div>

            {loading && (
              <p className="text-xs text-neutral-400">
                Cargando tus publicaciones desde Supabase…
              </p>
            )}

            {error && (
              <p className="text-xs text-amber-400">
                {error} (la demo local sigue funcionando igualmente).
              </p>
            )}

            {!loading && !error && posts.length === 0 && (
              <p className="text-xs text-neutral-400">
                Todavía no has subido ninguna foto desde la demo en vivo. Ve a{' '}
                <span className="font-medium text-emerald-400">
                  Demo &gt; Live
                </span>{' '}
                y sube tu primera imagen.
              </p>
            )}

            {!loading && posts.length > 0 && (
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60"
                  >
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.caption ?? 'Publicación Ethiqia'}
                        className="w-full max-h-[360px] object-cover"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
                        Publicación sin imagen
                      </div>
                    )}
                    <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-300">
                      <p className="line-clamp-2">
                        {post.caption || 'Imagen subida desde la demo en vivo.'}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-500">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de actividad */}
          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs text-neutral-300 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              Resumen de actividad
            </h2>

            {lastPost ? (
              <>
                <p>
                  Última publicación guardada en Supabase el{' '}
                  <span className="text-neutral-100">
                    {new Date(lastPost.created_at).toLocaleString()}
                  </span>
                  .
                </p>
                <p className="text-neutral-400">
                  Esta imagen se ha subido desde la demo en vivo y se muestra
                  tanto aquí como en el feed general de la demo.
                </p>
              </>
            ) : (
              <p className="text-neutral-400">
                Aún no hay actividad real. Sube una foto desde la demo para ver
                aquí tu historial.
              </p>
            )}

            {demoPost && (
              <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 space-y-1">
                <p className="text-[11px] text-neutral-400">
                  Último análisis de la demo:
                </p>
                <p className="text-[13px]">
                  Ethiqia Score:{' '}
                  <span className="font-semibold text-emerald-400">
                    {demoPost.score}/100
                  </span>
                </p>
                <p className="text-[10px] text-neutral-500">
                  Guardado localmente en este navegador para la demo.
                </p>
              </div>
            )}
          </aside>
        </section>

        {/* Mosaico simple con todas las fotos */}
        {posts.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              Mosaico de tus fotos reales
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {posts.map((post) =>
                post.image_url ? (
                  <img
                    key={post.id}
                    src={post.image_url}
                    alt={post.caption ?? 'Publicación Ethiqia'}
                    className="h-32 w-full object-cover rounded-xl border border-neutral-800"
                  />
                ) : null
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
