'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PostRow = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
};

export default function FeedPage() {
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
          console.error('Error cargando feed de Supabase:', error);
          setError('No se ha podido cargar el feed real.');
        } else {
          setPosts(data || []);
        }
      } catch (e) {
        console.error(e);
        setError('No se ha podido cargar el feed real.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            FEED
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones reales en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Aquí solo se muestran fotos reales subidas desde la demo en vivo.
            No hay imágenes falsas ni perfiles simulados: todo lo que ves se ha
            guardado en Supabase en la tabla{' '}
            <code className="bg-neutral-800 px-1 py-[1px] rounded">posts</code>.
          </p>
        </header>

        {loading && (
          <p className="text-xs text-neutral-400">
            Cargando publicaciones reales desde Supabase…
          </p>
        )}

        {error && (
          <p className="text-xs text-amber-400">{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="text-xs text-neutral-400">
            Todavía no hay publicaciones reales. Ve a{' '}
            <span className="font-medium text-emerald-400">
              Demo &gt; Live
            </span>{' '}
            y sube la primera foto analizada.
          </p>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70"
            >
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt={post.caption ?? 'Publicación Ethiqia'}
                  className="w-full object-cover max-h-[520px]"
                />
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-neutral-500">
                  Publicación sin imagen
                </div>
              )}
              <div className="px-4 py-3 border-t border-neutral-800 text-sm text-neutral-200">
                <h2 className="text-[13px] font-semibold">
                  Publicación analizada por Ethiqia
                </h2>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Esta imagen se ha subido desde la demo en tiempo real y se ha
                  guardado como publicación real en Supabase.
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
