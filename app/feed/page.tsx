'use client';

import { useEffect, useState } from 'react';

type StoredFeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
  author: string;
  location?: string;
  caption: string;
  aiProbability: number;
  authenticity: number;
  coherence: number;
  initialLikes: number;
  isDemoUserPost?: boolean;
};

type Comment = {
  id: string;
  text: string;
  createdAt: number;
};

const DEMO_AVATAR = '/demo/profile-stock.jpg';

const BASE_POSTS: FeedPost[] = [
  {
    id: 'base-1',
    imageUrl: '/demo/profile-stock.jpg',
    score: 86,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    author: 'Studio Nébula',
    location: 'Barcelona · España',
    caption:
      'Validando campañas de impacto y contenido generado por IA con Ethiqia antes de lanzarlas.',
    aiProbability: 22,
    authenticity: 88,
    coherence: 91,
    initialLikes: 134,
  },
  {
    id: 'base-2',
    imageUrl: '/demo/profile-stock.jpg',
    score: 92,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    author: 'Lumis Health Lab',
    location: 'Lisboa · Portugal',
    caption:
      'Ensayando protocolos de comunicación en healthtech con verificación automática de imágenes.',
    aiProbability: 15,
    authenticity: 94,
    coherence: 89,
    initialLikes: 201,
  },
  {
    id: 'base-3',
    imageUrl: '/demo/profile-stock.jpg',
    score: 64,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    author: 'Ana López',
    location: 'Santiago · Chile',
    caption:
      'Probando cómo Ethiqia detecta contenido mixto entre fotos reales y renders.',
    aiProbability: 43,
    authenticity: 71,
    coherence: 78,
    initialLikes: 89,
  },
  {
    id: 'base-4',
    imageUrl: '/demo/profile-stock.jpg',
    score: 78,
    createdAt: Date.now() - 1000 * 60 * 60 * 40,
    author: 'Equipo Ethiqia',
    location: 'Demo',
    caption:
      'Simulación de feed con puntuaciones, moderación de comentarios y reputación digital.',
    aiProbability: 28,
    authenticity: 82,
    coherence: 84,
    initialLikes: 167,
  },
];

const PROFANITY_LIST = ['tonto', 'idiota', 'gilipollas', 'imbécil', 'mierda'];

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

// Hash sencillo para "trazabilidad"
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 10);
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [moderationMessage, setModerationMessage] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let userPosts: FeedPost[] = [];
    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (raw) {
        const parsed = JSON.parse(raw) as StoredFeedPost[];
        if (Array.isArray(parsed)) {
          userPosts = parsed.map((p, index) => {
            const aiProbability = Math.max(
              5,
              Math.min(95, Math.round((100 - p.score) * 0.6 + 10))
            );
            const authenticity = Math.max(
              0,
              Math.min(100, Math.round(p.score + (Math.random() * 10 - 5)))
            );
            const coherence = 75 + (index % 10);

            return {
              id: p.id || `demo-${index}`,
              imageUrl: p.imageUrl,
              score: p.score,
              createdAt: p.createdAt || Date.now(),
              author: 'Tu perfil Ethiqia',
              location: 'Demo en vivo',
              caption: 'Publicación generada en la demo en tiempo real.',
              aiProbability,
              authenticity,
              coherence,
              initialLikes: 23 + index * 3,
              isDemoUserPost: true,
            };
          });
        }
      }
    } catch {
      // ignoramos errores
    }

    const merged = [...userPosts, ...BASE_POSTS];
    setPosts(merged);

    const initialLikesState: Record<string, number> = {};
    const initialLikedState: Record<string, boolean> = {};
    const initialSavedState: Record<string, boolean> = {};
    const initialCommentsState: Record<string, Comment[]> = {};
    const initialModerationState: Record<string, string | null> = {};
    const initialInputs: Record<string, string> = {};

    for (const post of merged) {
      initialLikesState[post.id] = post.initialLikes;
      initialLikedState[post.id] = false;
      initialSavedState[post.id] = false;
      initialModerationState[post.id] = null;
      initialInputs[post.id] = '';

      try {
        const rawComments = localStorage.getItem(
          `ethiqia_comments_${post.id}`
        );
        if (rawComments) {
          const parsedComments = JSON.parse(rawComments) as Comment[];
          if (Array.isArray(parsedComments)) {
            initialCommentsState[post.id] = parsedComments;
          } else {
            initialCommentsState[post.id] = [];
          }
        } else {
          initialCommentsState[post.id] = [];
        }
      } catch {
        initialCommentsState[post.id] = [];
      }
    }

    setLikes(initialLikesState);
    setLiked(initialLikedState);
    setSaved(initialSavedState);
    setComments(initialCommentsState);
    setModerationMessage(initialModerationState);
    setCommentInput(initialInputs);
  }, []);

  const handleToggleLike = (postId: string) => {
    setLikes((prev) => {
      const current = prev[postId] ?? 0;
      const isLiked = liked[postId];
      return {
        ...prev,
        [postId]: isLiked ? current - 1 : current + 1,
      };
    });

    setLiked((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleDoubleClick = (postId: string) => {
    if (!liked[postId]) {
      handleToggleLike(postId);
    }
  };

  const handleToggleSave = (postId: string) => {
    setSaved((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInput((prev) => ({
      ...prev,
      [postId]: value,
    }));
    setModerationMessage((prev) => ({
      ...prev,
      [postId]: null,
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = (commentInput[postId] || '').trim();
    if (!text) return;

    const lower = text.toLowerCase();
    const hasProfanity = PROFANITY_LIST.some((bad) => lower.includes(bad));

    if (hasProfanity) {
      setModerationMessage((prev) => ({
        ...prev,
        [postId]:
          'Comentario no publicado por infringir las normas de respeto de Ethiqia.',
      }));
      return;
    }

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      text,
      createdAt: Date.now(),
    };

    setComments((prev) => {
      const current = prev[postId] || [];
      const updated = [...current, newComment];

      try {
        localStorage.setItem(
          `ethiqia_comments_${postId}`,
          JSON.stringify(updated)
        );
      } catch {
        // ignoramos errores
      }

      return {
        ...prev,
        [postId]: updated,
      };
    });

    setCommentInput((prev) => ({
      ...prev,
      [postId]: '',
    }));
    setModerationMessage((prev) => ({
      ...prev,
      [postId]: null,
    }));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed demo
          </p>
          <h1 className="text-2xl font-semibold">Ethiqia Feed</h1>
          <p className="text-sm text-neutral-400">
            Vista tipo Instagram con publicaciones simuladas y, si has usado la{' '}
            demo en vivo (<code className="text-xs bg-neutral-900 px-1 py-[1px] rounded">
              /demo/live
            </code>), tus propias imágenes analizadas por la IA.
          </p>
        </header>

        <section className="space-y-6">
          {posts.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aún no hay publicaciones. Sube una imagen desde{' '}
              <code className="text-xs bg-neutral-900 px-1 py-[1px] rounded">
                /demo/live
              </code>{' '}
              para generar tu primera entrada en el feed.
            </p>
          )}

          {posts.map((post) => {
            const postLikes = likes[post.id] ?? post.initialLikes;
            const postLiked = liked[post.id] ?? false;
            const postSaved = saved[post.id] ?? false;
            const postComments = comments[post.id] || [];
            const inputValue = commentInput[post.id] || '';
            const modMsg = moderationMessage[post.id] || null;

            const hashId = simpleHash(post.id + post.imageUrl);
            const isVerified = post.aiProbability <= 25;

            return (
              <article
                key={post.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
              >
                {/* Cabecera tipo Instagram */}
                <header className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-xs font-semibold">
                    <img
                      src={DEMO_AVATAR}
                      alt={post.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                      {post.author}
                      {post.isDemoUserPost && (
                        <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-[1px] text-[10px] text-emerald-300">
                          Tú (demo)
                        </span>
                      )}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[1px] text-[10px] text-emerald-300 border border-emerald-500/50">
                          ✓ Imagen verificada
                        </span>
                      )}
                    </p>
                    {post.location && (
                      <p className="text-[11px] text-neutral-400">
                        {post.location}
                      </p>
                    )}
                  </div>
                  <span className="text-neutral-500 text-lg">⋯</span>
                </header>

                {/* Imagen con doble tap para like + badge de IA */}
                <div
                  className="relative bg-neutral-900"
                  onDoubleClick={() => handleDoubleClick(post.id)}
                >
                  <img
                    src={post.imageUrl}
                    alt="Publicación"
                    className="w-full max-h-[480px] object-cover select-none"
                  />

                  {/* Badge IA verificada / IA sospechosa */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-[2px] text-neutral-100">
                      ⭐ {post.score}/100
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] border ${
                        isVerified
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/60'
                          : post.aiProbability >= 60
                          ? 'bg-red-500/10 text-red-300 border-red-500/60'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/60'
                      }`}
                    >
                      {isVerified ? '✓ Real (baja prob. IA)' : ''}
                      {!isVerified && post.aiProbability >= 60
                        ? '⚠ Alta prob. IA'
                        : ''}
                      {!isVerified &&
                        post.aiProbability < 60 &&
                        post.aiProbability > 25 &&
                        'Mixta / dudosa'}
                    </span>
                  </div>
                </div>

                {/* Barra de acciones */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      {postLiked ? '❤️' : '🤍'}
                    </button>
                    <span className="text-neutral-400 text-lg">💬</span>
                    <span className="text-neutral-400 text-lg">📤</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSave(post.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    {postSaved ? '🔖' : '📑'}
                  </button>
                </div>

                {/* Info de likes, caption y análisis IA */}
                <div className="px-4 pb-3 space-y-2 text-sm">
                  <p className="text-neutral-200 text-sm">
                    <span className="font-semibold">{postLikes}</span>{' '}
                    {postLikes === 1 ? 'me gusta' : 'me gustas'}
                  </p>

                  <p className="text-sm text-neutral-200">
                    <span className="font-semibold mr-1">
                      {post.author}
                      {post.isDemoUserPost ? ' (tú)' : ''}
                    </span>
                    {post.caption}
                  </p>

                  <p className="text-[11px] text-neutral-500">
                    {formatDate(post.createdAt)}
                  </p>

                  {/* Panel IA más completo */}
                  <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-[11px] space-y-1">
                    <p className="text-[11px] text-neutral-300">
                      <span className="font-semibold">Ethiqia Score:</span>{' '}
                      <span className="text-emerald-400">
                        {post.score}/100
                      </span>
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      <span className="font-semibold">
                        Prob. de que sea IA:
                      </span>{' '}
                      {post.aiProbability}%
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      <span className="font-semibold">
                        Autenticidad estimada:
                      </span>{' '}
                      {post.authenticity}%
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      <span className="font-semibold">
                        Coherencia del contenido:
                      </span>{' '}
                      {post.coherence}%
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      <span className="font-semibold">
                        Hash de autenticidad:
                      </span>{' '}
                      <code className="bg-neutral-900 px-1 py-[1px] rounded">
                        {hashId}
                      </code>
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Hash simulado para trazabilidad. En la versión real,
                      Ethiqia podría registrar este identificador en una
                      infraestructura de confianza para auditar cambios en la
                      imagen y su reputación.
                    </p>
                  </div>
                </div>

                {/* Comentarios */}
                <div className="px-4 pb-3 space-y-2 text-sm border-t border-neutral-800 pt-3">
                  {postComments.length > 0 && (
                    <div className="space-y-1">
                      {postComments.slice(-3).map((c) => (
                        <p
                          key={c.id}
                          className="text-[13px] text-neutral-200"
                        >
                          <span className="font-semibold mr-1">
                            Usuario demo
                          </span>
                          {c.text}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Añadir un comentario…"
                        value={inputValue}
                        onChange={(e) =>
                          handleCommentChange(post.id, e.target.value)
                        }
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5 text-[13px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="text-[12px] text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Publicar
                      </button>
                    </div>
                    {modMsg && (
                      <p className="text-[11px] text-amber-400">
                        {modMsg}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
