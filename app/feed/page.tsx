// app/feed/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type RawSupabasePost = {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string | null;
};

type LocalDemoPost = {
  id: string;
  imageUrl: string;
  score?: number;
  createdAt?: number;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: number;
  source: 'supabase' | 'local';
};

type Comment = {
  id: string;
  text: string;
  createdAt: number;
};

type PostScores = {
  ethScore: number;
  authenticity: number;
  aiProbability: number;
  coherence: number;
  verdict: 'real' | 'dudosa' | 'ia';
};

// Utilidad simple para tener números pseudo-aleatorios
function hashToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function computeScoresForPost(post: FeedPost): PostScores {
  const seedBase = `${post.id}-${post.createdAt}-${post.source}`;
  const base = hashToNumber(seedBase);

  const aiProbability = (base % 71) + 10; // 10–80
  const authenticityRaw = 100 - aiProbability + ((base >> 3) % 11) - 5;
  const coherenceRaw = 70 + (base % 26); // 70–95

  const authenticity = Math.max(0, Math.min(100, authenticityRaw));
  const coherence = Math.max(0, Math.min(100, coherenceRaw));
  const aiSafe = Math.max(0, Math.min(100, aiProbability));

  const ethScore = Math.round(
    0.5 * authenticity + 0.3 * coherence + 0.2 * (100 - aiSafe)
  );

  let verdict: PostScores['verdict'];
  if (aiProbability < 20) verdict = 'real';
  else if (aiProbability < 60) verdict = 'dudosa';
  else verdict = 'ia';

  return {
    ethScore,
    authenticity,
    aiProbability,
    coherence,
    verdict,
  };
}

// Moderación muy sencilla de insultos / odio / acoso
function isCommentToxic(text: string): boolean {
  const lowered = text.toLowerCase();

  // Listas básicas (se pueden ampliar)
  const hardInsults = [
    'puta',
    'gilipollas',
    'subnormal',
    'idiota',
    'imbecil',
    'mierda',
    'asqueroso',
    'asquerosa',
    'vete a la mierda',
  ];

  const racism = ['negro de mierda', 'sudaca', 'moro de mierda'];
  const bullying = ['nadie te quiere', 'deberías matarte', 'ojalá te mueras'];

  const allBad = [...hardInsults, ...racism, ...bullying];

  return allBad.some((w) => lowered.includes(w));
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, Comment[]>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);

      // 1) Leer publicaciones DEMO desde localStorage (subidas desde /demo/live)
      let localPosts: FeedPost[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('ethiqia_feed_posts');
          if (raw) {
            const parsed = JSON.parse(raw) as LocalDemoPost[];
            localPosts = parsed
              .filter((p) => p.imageUrl)
              .map((p) => ({
                id: p.id,
                imageUrl: p.imageUrl,
                caption: 'Publicación subida desde la demo en vivo',
                createdAt: p.createdAt ?? Date.now(),
                source: 'local' as const,
              }));
          }
        } catch {
          // ignoramos errores
        }
      }

      // 2) Leer publicaciones reales desde Supabase
      let supabasePosts: FeedPost[] = [];
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, image_url, caption, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          supabasePosts = (data as RawSupabasePost[])
            .filter((p) => p.image_url)
            .map((p) => ({
              id: p.id,
              imageUrl: p.image_url as string,
              caption: p.caption,
              createdAt: p.created_at
                ? new Date(p.created_at).getTime()
                : Date.now(),
              source: 'supabase' as const,
            }));
        }
      } catch {
        // si falla, simplemente seguimos con las locales
      }

      const combined = [...localPosts, ...supabasePosts].sort(
        (a, b) => b.createdAt - a.createdAt
      );

      setPosts(combined);
      setLoading(false);
    }

    loadFeed();
  }, []);

  const handleToggleLike = (postId: string) => {
    setLikes((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleToggleSave = (postId: string) => {
    setSaved((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleShare = (post: FeedPost) => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Ethiqia',
          text: 'Mira esta publicación analizada por Ethiqia',
          url: window.location.origin + '/feed',
        })
        .catch(() => {});
    } else {
      alert('En la versión final podrás compartir la publicación.');
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
    setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleSubmitComment = (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    if (isCommentToxic(text)) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]:
          'Tu comentario ha sido bloqueado por infringir las normas de Ethiqia (odio, insultos o acoso).',
      }));
      return;
    }

    const newComment: Comment = {
      id: `${postId}-${Date.now()}`,
      text,
      createdAt: Date.now(),
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])],
    }));

    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setCommentErrors((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones reales en Ethiqia (demo)
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Aquí se mezclan las fotos subidas desde la demo en vivo y las
            guardadas en el backend real (Supabase). Puedes ver el Ethiqia
            Score, probabilidad de IA y dejar comentarios moderados por IA.
          </p>
        </header>

        {loading && (
          <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-400">
            Todavía no hay publicaciones. Sube tu primera imagen desde{' '}
            <span className="text-emerald-400">Demo &gt; Live</span>.
          </p>
        )}

        <div className="space-y-6">
          {posts.map((post) => {
            const scores = computeScoresForPost(post);
            const liked = !!likes[post.id];
            const savedPost = !!saved[post.id];
            const comments = commentsByPost[post.id] || [];
            const commentDraft = commentDrafts[post.id] || '';
            const errorMsg = commentErrors[post.id];

            const createdDate = new Date(post.createdAt);
            const createdLabel = createdDate.toLocaleString();

            let verdictLabel = '';
            let verdictClass = '';
            switch (scores.verdict) {
              case 'real':
                verdictLabel = 'Foto real (baja prob. IA)';
                verdictClass =
                  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
                break;
              case 'dudosa':
                verdictLabel = 'Imagen dudosa';
                verdictClass =
                  'bg-amber-500/15 text-amber-300 border border-amber-500/40';
                break;
              case 'ia':
                verdictLabel = 'Alta probabilidad de IA';
                verdictClass =
                  'bg-rose-500/15 text-rose-300 border border-rose-500/40';
                break;
            }

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden"
              >
                {/* Cabecera usuario + badge IA */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-semibold">
                      {/* Inicial fake, en producción vendrá del nombre de usuario */}
                      D
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        David (demo usuario)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {createdLabel}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap ${verdictClass}`}
                  >
                    {verdictLabel}
                  </span>
                </div>

                {/* Imagen */}
                <div className="relative bg-black">
                  <img
                    src={post.imageUrl}
                    alt={post.caption ?? 'Publicación de Ethiqia'}
                    className="w-full max-h-[520px] object-cover"
                  />
                </div>

                {/* Contenido y métricas IA */}
                <div className="px-4 pt-3 pb-4 space-y-3">
                  {post.caption && (
                    <p className="text-sm text-neutral-200">{post.caption}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Ethiqia Score global
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {scores.ethScore}/100
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${scores.ethScore}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">
                            Autenticidad
                          </span>
                          <span className="text-neutral-100">
                            {scores.authenticity}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${scores.authenticity}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Prob. IA</span>
                          <span className="text-neutral-100">
                            {scores.aiProbability}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${scores.aiProbability}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Coherencia</span>
                          <span className="text-neutral-100">
                            {scores.coherence}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${scores.coherence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de acciones */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className="flex items-center gap-1 text-neutral-300 hover:text-rose-400"
                      >
                        <span>{liked ? '❤️' : '🤍'}</span>
                        <span>Te gusta</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-neutral-300"
                      >
                        <span>💬</span>
                        <span>Comentar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className="flex items-center gap-1 text-neutral-300 hover:text-emerald-400"
                      >
                        <span>{savedPost ? '📌' : '📎'}</span>
                        <span>Guardado</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-1 text-neutral-300 hover:text-sky-400"
                    >
                      <span>📤</span>
                      <span>Compartir</span>
                    </button>
                  </div>

                  {/* Contadores muy simples */}
                  <div className="mt-1 text-[11px] text-neutral-500 flex gap-3">
                    <span>
                      {liked ? 1 : 0} me gusta (demo, no es contador real)
                    </span>
                    <span>{comments.length} comentarios</span>
                  </div>

                  {/* Comentarios */}
                  <div className="mt-3 space-y-2">
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Comentar (moderado por IA)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDraft}
                        onChange={(e) =>
                          handleCommentChange(post.id, e.target.value)
                        }
                        placeholder="Escribe un comentario respetuoso…"
                        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitComment(post.id)}
                        className="rounded-lg bg-emerald-500/90 px-3 text-xs font-semibold text-neutral-900 hover:bg-emerald-400"
                      >
                        Publicar
                      </button>
                    </div>
                    {errorMsg && (
                      <p className="text-[11px] text-amber-400">{errorMsg}</p>
                    )}

                    {comments.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="text-[12px] text-neutral-200 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5"
                          >
                            <span className="font-medium mr-1">
                              David (demo):
                            </span>
                            <span>{c.text}</span>
                          </div>
                        ))}
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
