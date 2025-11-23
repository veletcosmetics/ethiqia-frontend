'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Post = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando posts desde Supabase', error);
        setPosts([]);
      } else {
        setPosts((data || []) as Post[]);
      }
      setLoading(false);
    };

    load();
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones reales en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400">
            Aquí solo se muestran fotos subidas desde la demo en vivo.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-400">
            Todavía no hay publicaciones. Sube una foto en la demo en vivo para
            ver aquí el resultado.
          </p>
        )}

        <div className="space-y-6 pb-10">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Publicación Ethiqia'}
                className="w-full max-h-[520px] object-cover"
              />
              <div className="border-t border-neutral-800 px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-neutral-100">
                  Publicación analizada por Ethiqia
                </p>
                <p className="text-xs text-neutral-400">
                  Esta imagen se ha subido desde la demo en tiempo real y se ha
                  guardado en Supabase.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
