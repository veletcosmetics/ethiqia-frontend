'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addNotification } from '@/lib/notifications';

type FeedPost = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  score: number;
};

type LocalComment = {
  id: string;
  postId: string;
  content: string;
  createdAt: number;
};

const BANNED_WORDS = [
  'puta',
  'puto',
  'gilipollas',
  'subnormal',
  'idiota',
  'imbécil',
  'mierda',
  'cabrón',
  'maricón',
  'negro de mierda',
  'sudaca',
  'abortista',
  'nazista',
  'hitler',
  'te voy a matar',
  'ojalá te mueras',
];

function computeScoreFromId(id: string): number {
  let acc = 0;
  for (const ch of id) acc += ch.charCodeAt(0);
  // 60–100
  return 60 + (acc % 41);
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // estado UI local
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, LocalComment[]>
  >({});
  const [pendingComment, setPendingComment] = useState<Record<string, string>>(
    {}
  );
  const [moderationMsg, setModerationMsg] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, image_url, caption, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(error);
          setError('No se pudieron cargar las publicaciones.');
          setPosts([]);
          return;
        }

        const mapped: FeedPost[] =
          data?.map((row: any) => ({
            id: row.id,
            imageUrl: row.image_url,
            caption: row.caption ?? null,
            createdAt: row.created_at,
            score: computeScoreFromId(row.id),
          })) ?? [];

        setPosts(mapped);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar las publicaciones.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleLikeToggle = (postId: string) => {
    setLiked((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSaveToggle = (postId: string) => {
    setSaved((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/feed#${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Publicación en Ethiqia',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles.');
      }
    } catch {
      // usuario cancela, no pasa nada
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setPendingComment((prev) => ({ ...prev, [postId]: value }));
    // al escribir limpiamos mensaje de moderación
    setModerationMsg((prev) => ({ ...prev, [postId]: null }));
  };

  const handleCommentSubmit = (postId: string) => {
    const raw = (pendingComment[postId] || '').trim();
    if (!raw) return;

    const textLower = raw.toLowerCase();

    // moderación básica por IA (simulada)
    const isBlocked = BANNED_WORDS.some((w) => textLower.includes(w));
    if (isBlocked) {
      setModerationMsg((prev) => ({
        ...prev,
        [postId]:
          'Tu comentario ha sido bloqueado por infringir las normas de Ethiqia (insultos, odio o acoso).',
      }));

      try {
        addNotification(
          'comment-blocked',
          'Tu comentario fue bloqueado por infringir las normas de Ethiqia.'
        );
      } catch {
        // no romper si falla notificación
      }

      return;
    }

    // si pasa filtrado, lo añadimos a comentarios locales (no backend)
    const newComment: LocalComment = {
      id: `c-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      postId,
      content: raw,
      createdAt: Date.now(),
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])],
    }));

    setPendingComment((prev) => ({ ...prev, [postId]: '' }));
    setModerationMsg((prev) => ({ ...prev, [postId]: null }));

    try {
      addNotification(
        'comment-approved',
        'Tu comentario se ha publicado correctamente.'
      );
    } catch {
      // ignoramos errores de notificación
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Cargando publicaciones reales de la demo…
        </p>
      </main>
    );
  }

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
          <p className="text-sm text-neutral-400">
            Aquí solo se muestran las fotos que se han subido desde la demo en
            vivo y que se han guardado en el backend real (Supabase). Puedes
            dar like, comentar (moderado por IA), guardar y simular compartir.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {posts.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 px-4 py-10 text-center text-sm text-neutral-400">
            Aún no hay publicaciones reales. Sube una foto desde la demo en vivo
            para verla aquí.
          </div>
        )}

        {posts.map((post) => {
          const isLiked = liked[post.id] ?? false;
          const isSaved = saved[post.id] ?? false;
          const comments = commentsByPost[post.id] || [];
          const pending = pendingComment[post.id] || '';
          const modMsg = moderationMsg[post.id] || null;

          return (
            <article
              key={post.id}
              id={post.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/70 overflow-hidden"
            >
              {/* Imagen */}
              <div className="bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt={post.caption || 'Publicación en Ethiqia'}
                  className="w-full max-h-[640px] object-contain bg-black"
                />
              </div>

              <div className="p-4 space-y-3">
                {/* Barra de acciones */}
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeToggle(post.id)}
                      className="flex items-center gap-1 hover:text-emerald-400 transition"
                    >
                      <span>{isLiked ? '❤️' : '🤍'}</span>
                      <span>Te gusta</span>
                    </button>

                    <div className="flex items-center gap-1 text-neutral-400">
                      <span>💬</span>
                      <span>Comentar</span>
                    </div>

                    <button
                      onClick={() => handleSaveToggle(post.id)}
                      className="flex items-center gap-1 hover:text-emerald-400 transition"
                    >
                      <span>{isSaved ? '📌' : '🔖'}</span>
                      <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1 text-neutral-400 hover:text-emerald-400 transition"
                  >
                    <span>📤</span>
                    <span>Compartir</span>
                  </button>
                </div>

                {/* Meta / score */}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div>
                    <span className="font-semibold text-emerald-400">
                      Ethiqia Score: {post.score}/100
                    </span>
                    {post.caption && (
                      <span className="ml-2 text-neutral-300">
                        {post.caption}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px]">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Comentarios existentes (locales) */}
                {comments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs text-neutral-200 bg-neutral-900/90 rounded-lg px-3 py-2"
                      >
                        <span className="font-semibold text-emerald-300">
                          Tú
                        </span>
                        <span className="mx-1 text-neutral-500">•</span>
                        <span>{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Caja de comentario */}
                <div className="mt-3 space-y-1">
                  <label className="text-[11px] text-neutral-400">
                    Comentar (moderado por IA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pending}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                      placeholder="Escribe un comentario respetuoso…"
                      className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950/70 px-3 py-2 text-xs outline-none focus:border-emerald-400"
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      className="text-xs px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
                    >
                      Publicar
                    </button>
                  </div>
                  {modMsg && (
                    <p className="text-[11px] text-amber-400 mt-1">{modMsg}</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
