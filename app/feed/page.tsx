'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FeedPost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

const BANNED_WORDS = [
  'puta',
  'puto',
  'gilipollas',
  'idiota',
  'subnormal',
  'imbécil',
  'cabron',
  'cabrón',
  'mierda',
  'asco',
];

function containsInsult(text: string) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((w) => lower.includes(w));
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando posts del feed:', error);
        setPosts([]);
      } else {
        setPosts(data as FeedPost[]);
      }

      setLoading(false);
    };

    loadPosts();
  }, []);

  const handleCommentChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const handlePublishComment = (postId: string) => {
    const text = commentDrafts[postId] || '';
    if (!text.trim()) return;

    if (containsInsult(text)) {
      alert(
        'Tu comentario contiene lenguaje ofensivo. La IA de Ethiqia bloquea insultos y discurso de odio.'
      );
      return;
    }

    // En esta demo no guardamos el comentario en la base de datos:
    // solo mostramos el flujo moderado por IA.
    alert('Comentario aceptado por la IA (en demo no se guarda en backend).');
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  const toggleLike = (postId: string) => {
    setLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleSaved = (postId: string) => {
    setSaved((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Publicaciones reales en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400">
            Estas son las imágenes que se han subido desde la demo en vivo y se
            han guardado en el backend real (Supabase). Puedes dar like,
            comentar (moderado por IA), guardar y simular compartir.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-neutral-500">Cargando publicaciones…</p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-500">
            Aún no hay publicaciones reales. Sube una foto desde la demo en vivo
            para verla aquí.
          </p>
        )}

        <div className="space-y-10">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              <div className="w-full bg-black">
                {/* la imagen viene como dataURL desde Supabase */}
                <img
                  src={post.image_url}
                  alt={post.caption || 'Publicación en Ethiqia'}
                  className="w-full max-h-[640px] object-contain bg-black"
                />
              </div>

              <div className="p-4 space-y-3">
                {/* Acciones sociales (solo frontend, sin guardar en DB en esta demo) */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 hover:border-emerald-400"
                  >
                    <span>{likes[post.id] ? '❤️' : '🤍'}</span>
                    <span>Te gusta</span>
                  </button>

                  <span className="inline-flex items-center gap-1 text-neutral-400">
                    💬 <span>Comentar</span>
                  </span>

                  <button
                    onClick={() => toggleSaved(post.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 hover:border-emerald-400"
                  >
                    <span>{saved[post.id] ? '⭐' : '☆'}</span>
                    <span>Guardado</span>
                  </button>

                  <span className="inline-flex items-center gap-1 text-neutral-400">
                    📤 <span>Compartir (demo)</span>
                  </span>
                </div>

                {/* Metadatos simples */}
                <div className="text-[11px] text-neutral-500 space-y-1">
                  <p>
                    <span className="font-semibold text-emerald-400">
                      Ethiqia Score:
                    </span>{' '}
                    <span>72/100</span>{' '}
                    <span className="text-neutral-500">
                      (score simulado en esta demo)
                    </span>
                  </p>
                  <p className="break-all">
                    ID imagen:{' '}
                    <span className="text-neutral-400">
                      {post.caption || '(sin título)'}
                    </span>
                  </p>
                </div>

                {/* Comentarios moderados por IA */}
                <div className="space-y-2">
                  <p className="text-[11px] text-neutral-400">
                    Comentar (moderado por IA)
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      placeholder="Escribe un comentario respetuoso…"
                      className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={() => handlePublishComment(post.id)}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
