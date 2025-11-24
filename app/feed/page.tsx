'use client';

import { useEffect, useState } from 'react';
import { getDemoFeedPosts, type DemoFeedPost } from '@/lib/feed';

type FeedComment = {
  id: string;
  text: string;
  createdAt: number;
};

type Interactions = {
  liked: boolean;
  saved: boolean;
  comments: FeedComment[];
};

type InteractionsState = Record<string, Interactions>;

const INTERACTIONS_KEY = 'ethiqia_feed_interactions_v2';

const BAD_WORDS = [
  'puta',
  'gilipollas',
  'idiota',
  'tonto',
  'mierda',
  'cabrón',
  'imbécil',
  'subnormal',
];

function isToxic(text: string) {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoFeedPost[]>([]);
  const [interactions, setInteractions] = useState<InteractionsState>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setPosts(getDemoFeedPosts());

    try {
      const raw = window.localStorage.getItem(INTERACTIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InteractionsState;
        setInteractions(parsed);
      }
    } catch {
      setInteractions({});
    }
  }, []);

  const persistInteractions = (next: InteractionsState) => {
    setInteractions(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(next));
    }
  };

  const toggleLike = (postId: string) => {
    const current = interactions[postId] || {
      liked: false,
      saved: false,
      comments: [],
    };
    const next: InteractionsState = {
      ...interactions,
      [postId]: { ...current, liked: !current.liked },
    };
    persistInteractions(next);
  };

  const toggleSave = (postId: string) => {
    const current = interactions[postId] || {
      liked: false,
      saved: false,
      comments: [],
    };
    const next: InteractionsState = {
      ...interactions,
      [postId]: { ...current, saved: !current.saved },
    };
    persistInteractions(next);
  };

  const handleShare = () => {
    alert(
      'En la versión real podrías compartir este post con un enlace público o en otras redes.'
    );
  };

  const handleChangeDraft = (postId: string, text: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: text }));
    setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleSubmitComment = (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    if (isToxic(text)) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]:
          'Tu comentario no se ha publicado porque infringe las normas de respeto.',
      }));
      return;
    }

    const current = interactions[postId] || {
      liked: false,
      saved: false,
      comments: [],
    };

    const newComment: FeedComment = {
      id: `c-${Date.now()}`,
      text,
      createdAt: Date.now(),
    };

    const next: InteractionsState = {
      ...interactions,
      [postId]: {
        ...current,
        comments: [newComment, ...current.comments],
      },
    };

    persistInteractions(next);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones analizadas por Ethiqia
          </h1>
          <p className="text-sm text-neutral-400">
            Aquí se muestran las imágenes que subes desde la demo en vivo. Los
            likes, comentarios, guardados y compartidos son parte de esta demo
            local.
          </p>
        </header>

        {posts.length === 0 && (
          <p className="text-xs text-neutral-400">
            Todavía no hay publicaciones. Ve a{' '}
            <span className="font-medium text-emerald-400">Demo &gt; Live</span>{' '}
            y sube tu primera imagen.
          </p>
        )}

        <div className="space-y-6">
          {posts.map((post) => {
            const inter = interactions[post.id] || {
              liked: false,
              saved: false,
              comments: [],
            };
            const draft = commentDrafts[post.id] || '';
            const error = commentErrors[post.id] || '';

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70"
              >
                <div className="w-full bg-black">
                  <img
                    src={post.imageUrl}
                    alt={`Publicación Ethiqia (${post.score}/100)`}
                    className="w-full max-h-[480px] object-cover"
                  />
                </div>

                <div className="px-4 py-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center gap-1 text-neutral-200 hover:text-emerald-300"
                      >
                        <span>{inter.liked ? '❤️' : '🤍'}</span>
                        <span>{inter.liked ? 'Te gusta' : 'Me gusta'}</span>
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-1 text-neutral-200"
                        onClick={() => {
                          const el = document.getElementById(
                            `comment-input-${post.id}`
                          );
                          if (el) {
                            el.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                            (el as HTMLInputElement).focus();
                          }
                        }}
                      >
                        <span>💬</span>
                        <span>Comentar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSave(post.id)}
                        className="flex items-center gap-1 text-neutral-200 hover:text-emerald-300"
                      >
                        <span>{inter.saved ? '🔖' : '📎'}</span>
                        <span>{inter.saved ? 'Guardado' : 'Guardar'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="text-neutral-200 hover:text-emerald-300"
                    >
                      ↗️ Compartir
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <p>
                      Ethiqia Score:{' '}
                      <span className="font-semibold text-emerald-300">
                        {post.score}/100
                      </span>
                    </p>
                    <p className="text-[11px]">
                      {new Date(post.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>

                  <div className="border-t border-neutral-800 pt-3 space-y-2">
                    <div className="space-y-1">
                      <label
                        htmlFor={`comment-input-${post.id}`}
                        className="text-[11px] text-neutral-400"
                      >
                        Comentar (moderado por IA)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`comment-input-${post.id}`}
                          type="text"
                          value={draft}
                          onChange={(e) =>
                            handleChangeDraft(post.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmitComment(post.id);
                            }
                          }}
                          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-emerald-400"
                          placeholder="Escribe un comentario respetuoso…"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitComment(post.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
                        >
                          Publicar
                        </button>
                      </div>
                      {error && (
                        <p className="text-[11px] text-amber-400">{error}</p>
                      )}
                      {!error && draft && !isToxic(draft) && (
                        <p className="text-[11px] text-emerald-300">
                          ✓ Tu comentario cumple las normas de respeto.
                        </p>
                      )}
                    </div>

                    {inter.comments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-neutral-400">
                          Comentarios ({inter.comments.length})
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {inter.comments.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-md bg-neutral-900/80 px-2 py-1 text-[11px]"
                            >
                              <p className="text-neutral-100">{c.text}</p>
                              <p className="text-[10px] text-neutral-500">
                                {new Date(c.createdAt).toLocaleString('es-ES')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
