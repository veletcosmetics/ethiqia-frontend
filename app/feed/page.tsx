'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { getSession, type Session } from '@/lib/session';
import { addNotification } from '@/lib/notifications';

// ---- Tipos ----

type DbPost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string | null;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  userName: string;
  aiProbability: number;
  authScore: number;
  ethScore: number;
  isDemo?: boolean;
};

type Comment = {
  id: string;
  text: string;
  blocked: boolean;
  createdAt: string;
};

type FeedState = {
  session: Session | null;
  loading: boolean;
  posts: FeedPost[];
  comments: Record<string, Comment[]>;
  pendingComment: Record<string, string>;
};

// ---- Datos de demo fijos (Londres, etc.) ----

const DEMO_POSTS: FeedPost[] = [
  {
    id: 'demo-1',
    imageUrl: '/demo/london.jpg',
    caption:
      'Publicación demo: cómo se vería una marca verificada compartiendo contenido real con Ethiqia Score visible.',
    createdAt: new Date().toISOString(),
    userName: 'Ethiqia Demo',
    aiProbability: 18,
    authScore: 92,
    ethScore: 88,
    isDemo: true,
  },
  {
    id: 'demo-2',
    imageUrl: '/demo/profile-stock.jpg',
    caption:
      'Ejemplo de portfolio profesional: estudio creativo mostrando su trabajo con trazabilidad y reputación digital.',
    createdAt: new Date().toISOString(),
    userName: 'Studio Nébula',
    aiProbability: 27,
    authScore: 81,
    ethScore: 83,
    isDemo: true,
  },
];

const FORBIDDEN_WORDS = [
  'idiota',
  'imbécil',
  'subnormal',
  'mierda',
  'asco',
  'puta',
  'cabron',
  'gilipollas',
  'muérete',
  'racista',
  'negro de mierda',
  'maricón',
  'gorda de mierda',
];

// ---- Helpers ----

function generateScoresFromDate(createdAt: string): {
  aiProbability: number;
  authScore: number;
  ethScore: number;
} {
  // Pseudorand basado en fecha para que no sea siempre igual
  const seed = new Date(createdAt).getTime() || Date.now();
  const rand = (seed: number) =>
    Math.abs(Math.sin(seed * 1.37) * 1000) % 100;

  const ai = Math.round(10 + (rand(seed) % 70)); // 10–80
  const auth = Math.max(0, Math.min(100, 100 - ai + (rand(seed + 1) % 15) - 7));
  const eth = Math.round(0.5 * auth + 0.3 * 80 + 0.2 * (100 - ai));

  return {
    aiProbability: ai,
    authScore: auth,
    ethScore: eth,
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function containsForbidden(text: string) {
  const lower = text.toLowerCase();
  return FORBIDDEN_WORDS.some((w) => lower.includes(w));
}

export default function FeedPage() {
  const [state, setState] = useState<FeedState>({
    session: null,
    loading: true,
    posts: [],
    comments: {},
    pendingComment: {},
  });

  // Carga inicial: sesión + posts de Supabase
  useEffect(() => {
    async function load() {
      try {
        const s = getSession();

        let dbPosts: DbPost[] = [];
        const { data, error } = await supabase
          .from('posts')
          .select('id,image_url,caption,created_at,user_id')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbPosts = data as DbPost[];
        }

        // Convertir posts reales a FeedPost
        const realPosts: FeedPost[] = dbPosts.map((p) => {
          const scores = generateScoresFromDate(p.created_at);
          return {
            id: p.id,
            imageUrl: p.image_url,
            caption: p.caption ?? 'Publicación subida desde la demo en vivo.',
            createdAt: p.created_at,
            userName:
              s?.user?.id && s.user.id === p.user_id
                ? s.user.name || 'Tú'
                : 'Usuario Ethiqia',
            aiProbability: scores.aiProbability,
            authScore: scores.authScore,
            ethScore: scores.ethScore,
          };
        });

        // Mezcla: primero posts reales, luego demo
        const mixed = [...realPosts, ...DEMO_POSTS];

        setState((prev) => ({
          ...prev,
          session: s ?? null,
          posts: mixed,
          loading: false,
        }));
      } catch (e) {
        console.error(e);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    load();
  }, []);

  const { posts, loading, comments, pendingComment } = state;

  // Manejo de likes & guardados solo en memoria (para demo visual)
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSave = (id: string) => {
    setSavedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Comentario en textarea
  const handleCommentChange = (postId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      pendingComment: {
        ...prev.pendingComment,
        [postId]: value,
      },
    }));
  };

  const handleCommentSubmit = (postId: string) => {
    const text = state.pendingComment[postId]?.trim();
    if (!text) return;

    const blocked = containsForbidden(text);

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      text,
      blocked,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      comments: {
        ...prev.comments,
        [postId]: [...(prev.comments[postId] || []), newComment],
      },
      pendingComment: {
        ...prev.pendingComment,
        [postId]: '',
      },
    }));

    // Notificación demo
    try {
      if (blocked) {
        addNotification(
          'comment-blocked',
          'Tu comentario fue bloqueado por infringir las normas de Ethiqia. Pierdes 0,8 puntos de reputación en este bloque.'
        );
      } else {
        addNotification(
          'comment-approved',
          'Tu comentario fue aprobado por la IA de Ethiqia.'
        );
      }
    } catch {
      // ignoramos errores de notificación
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        {/* Cabecera */}
        <header className="border-b border-neutral-900 pb-4">
          <h1 className="text-xl font-semibold">Feed de Ethiqia</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Aquí se mezclan publicaciones reales subidas desde la demo con
            ejemplos preparados para explicar Ethiqia a inversores y al Parque
            Científico.
          </p>
        </header>

        {loading && (
          <p className="mt-4 text-sm text-neutral-500">
            Cargando publicaciones...
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            Todavía no hay publicaciones. Sube una imagen desde{' '}
            <span className="font-mono text-emerald-400">Demo &gt; Live</span>.
          </p>
        )}

        {/* LISTA DE POSTS */}
        {!loading &&
          posts.map((post) => {
            const postComments = comments[post.id] || [];
            const liked = likedPosts[post.id];
            const saved = savedPosts[post.id];

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/80"
              >
                {/* Cabecera del post */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {post.userName}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {post.isDemo ? 'Perfil demo' : 'Usuario real · Supabase'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                {/* Imagen */}
                <div className="relative aspect-[4/5] w-full bg-neutral-900">
                  {post.imageUrl.startsWith('data:') ? (
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={post.imageUrl}
                      alt={post.caption}
                      fill
                      className="object-cover"
                    />
                  )}

                  {/* Badge IA arriba a la derecha */}
                  <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] text-neutral-100">
                    IA: {post.aiProbability}%
                  </div>

                  {/* Barra Ethiqia Score abajo */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-200">
                        Ethiqia Score:{' '}
                        <span className="font-semibold text-emerald-400">
                          {post.ethScore}/100
                        </span>
                      </span>
                      <span className="text-[11px] text-neutral-300">
                        Autenticidad {post.authScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones + caption + comentarios */}
                <div className="space-y-3 px-4 py-3 text-sm">
                  {/* Acciones */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xl">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className="hover:scale-110 transition-transform"
                        aria-label="Me gusta"
                      >
                        {liked ? '❤️' : '🤍'}
                      </button>
                      <button
                        type="button"
                        className="hover:scale-110 transition-transform"
                        aria-label="Comentar"
                      >
                        💬
                      </button>
                      <button
                        type="button"
                        className="hover:scale-110 transition-transform"
                        aria-label="Compartir"
                      >
                        📤
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSave(post.id)}
                      className="text-xl hover:scale-110 transition-transform"
                      aria-label="Guardar"
                    >
                      {saved ? '🔖' : '📎'}
                    </button>
                  </div>

                  {/* Caption */}
                  <p className="text-sm text-neutral-200">
                    <span className="font-semibold mr-1">
                      {post.userName}:
                    </span>
                    {post.caption}
                  </p>

                  {/* Comentarios existentes (solo en memoria para demo) */}
                  {postComments.length > 0 && (
                    <div className="space-y-1">
                      {postComments.map((c) => (
                        <p
                          key={c.id}
                          className={`text-xs ${
                            c.blocked
                              ? 'text-neutral-500 italic'
                              : 'text-neutral-200'
                          }`}
                        >
                          {c.blocked
                            ? 'Comentario bloqueado por la IA de Ethiqia.'
                            : c.text}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Formulario de comentario */}
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={pendingComment[post.id] || ''}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      placeholder="Escribe un comentario (la IA bloqueará insultos, acoso, racismo, etc.)"
                      className="min-h-[48px] w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-neutral-500">
                        Comentarios con hate, insultos o racismo serán
                        bloqueados y notificarán pérdida de reputación.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post.id)}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-neutral-950 hover:bg-emerald-400"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}
