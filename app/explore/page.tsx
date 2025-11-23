'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PostRow = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          console.error('Error cargando posts para Explorar:', error);
          setError('No se han podido cargar las publicaciones.');
        } else {
          setPosts(data || []);
        }
      } catch (e) {
        console.error(e);
        setError('No se han podido cargar las publicaciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            EXPLORAR
          </p>
          <h1 className="text-2xl font-semibold">
            Descubre publicaciones reales en Ethiqia
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Aquí solo se muestran imágenes que se han subido desde la demo en
            vivo y se han guardado en Supabase. Nada de perfiles falsos ni
            contenido simulado: todo viene de actividad real.
          </p>
        </header>

        {loading && (
          <p className="text-xs text-neutral-400">
            Cargando publicaciones reales…
          </p>
        )}

        {error && (
          <p className="text-xs text-amber-400">{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="text-xs text-neutral-400">
            Todavía no hay publicaciones para explorar. Ve a{' '}
            <span className="font-medium text-emerald-400">Demo &gt; Live</span>{' '}
            y sube la primera imagen analizada.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.map((post) =>
            post.image_url ? (
              <article
                key={post.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
              >
                <img
                  src={post.image_url}
                  alt={post.caption ?? 'Publicación Ethiqia'}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-2 bottom-2 space-y-1 text-[10px]">
                  <p className="line-clamp-2 text-neutral-100">
                    {post.caption || 'Imagen subida en Ethiqia'}
                  </p>
                  <p className="text-[9px] text-neutral-400">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </article>
            ) : null
          )}
        </div>
      </section>
    </main>
  );
}
