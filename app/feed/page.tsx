'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type FeedPost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
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

// Métricas simuladas pero deterministas por post
function getMetrics(post: FeedPost) {
  const base = post.id
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const score = 60 + (base % 35); // 60–94
  const aiProbability = 5 + (base % 70); // 5–74
  return { score, aiProbability };
}

function getAIBadge(ai: number) {
  if (ai <= 20) {
    return {
      label: 'Contenido real estimado',
      className:
        'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    };
  }
  if (ai <= 50) {
    return {
      label: 'Contenido mixto / dudoso',
      className: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    };
  }
  return {
    label: 'Alta prob. de IA',
    className: 'bg-red-500/10 text-red-300 border-red-500/40',
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at')
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
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    if (containsInsult(text)) {
      alert(
        'Tu comentario contiene lenguaje ofensivo. La IA de Ethiqia bloquea insultos y discurso de odio.'
      );
      return;
    }

    alert(
      'Comentario aceptado por la IA. En esta demo no se guarda aún en el backend, solo muestra el flujo moderado.'
    );
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
            Feed de publicaciones en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400">
            Aquí se muestran las imágenes que se han subido desde la demo en vivo
            y se han guardado en la base de datos real (Supabase). Cada post tiene
            un Ethiqia Score simulado, un indicador IA/real y acciones sociales.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-neutral-500">Cargando publicaciones…</p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-500">
            Aún no hay publicaciones. Sube una foto desde{' '}
            <a
              href="/demo/live"
              className="text-emerald-400 underline underline-offset-2"
            >
              la demo en vivo
            </a>{' '}
            para verla aquí.
          </p>
        )}

        <div className="space-y-10">
          {posts.map((post) => {
            const metrics = getMetrics(post);
            const badge = getAIBadge(metrics.aiProbability);
            const created =
              post.created_at &&
              new Date(post.created_at).toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short',
              });

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
              >
                {/* Cabecera del post */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold">
                      E
                    </div>
                    <div className="space-y-[2px]">
                      <p className="text-xs font-medium text-neutral-100">
                        Usuario demo Ethiqia
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Publicación guardada en backend real
                        {created ? ` · ${created}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[18px] text-neutral-500">•••</span>
                </div>

                {/* Imagen */}
                <div className="bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Publicación en Ethiqia'}
                    className="w-full max-h-[520px] object-contain bg-black"
                  />
                </div>

                {/* Contenido bajo la imagen */}
                <div className="p-4 space-y-4">
                  {/* Métricas IA + score */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-400">
                        Ethiqia Score estimado
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-emerald-400">
                          {metrics.score}
                        </span>
                        <span className="text-xs text-neutral-500">/100</span>
                      </div>
                      <div className="h-1.5 w-40 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${metrics.score}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-neutral-400">
                        Probabilidad de imagen IA
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-100">
                          {metrics.aiProbability}%
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-40 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${metrics.aiProbability}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Texto del post */}
                  {post.caption && (
                    <div className="text-sm text-neutral-200">
                      <span className="font-semibold mr-1">
                        Usuario demo:
                      </span>
                      <span>{post.caption}</span>
                    </div>
                  )}

                  {/* Acciones sociales */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 hover:border-emerald-400"
                    >
                      <span>{likes[post.id] ? '❤️' : '🤍'}</span>
                      <span>Te gusta</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1"
                    >
                      <span>💬</span>
                      <span>Comentar</span>
                    </button>

                    <button
                      onClick={() => toggleSaved(post.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 hover:border-emerald-400"
                    >
                      <span>{saved[post.id] ? '⭐' : '☆'}</span>
                      <span>Guardar</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1"
                    >
                      <span>📤</span>
                      <span>Compartir</span>
                    </button>
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
                    <p className="text-[11px] text-neutral-500">
                      La IA de Ethiqia bloquea insultos y discurso de odio antes
                      de publicar el comentario.
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
