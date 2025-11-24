'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addNotification } from '@/lib/notifications';
import { getSession } from '@/lib/session';

type Post = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
};

type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string | null;
  is_flagged: boolean | null;
};

type FeedPost = Post & {
  comments: Comment[];
};

type SessionData = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
};

// Lista sencilla de palabras prohibidas / conflictivas
const HARD_BLOCKED_WORDS = [
  'idiota',
  'imbécil',
  'gilipollas',
  'maldito',
  'vete a morir',
  'te odio',
  'asqueroso',
  'puto',
];

const SOFT_FLAG_WORDS = [
  'odio',
  'asco',
  'estúpido',
  'ridículo',
  'basura',
];

function moderateComment(text: string): {
  allowed: boolean;
  flagged: boolean;
  reason?: string;
} {
  const t = text.toLowerCase();

  // Bloqueo duro: insultos o frases agresivas claras
  if (HARD_BLOCKED_WORDS.some((w) => t.includes(w))) {
    return {
      allowed: false,
      flagged: true,
      reason:
        'Comentario no publicado por infringir las normas (lenguaje de odio, acoso o insultos directos).',
    };
  }

  // Flag suave: tono agresivo / conflictivo
  if (SOFT_FLAG_WORDS.some((w) => t.includes(w))) {
    return {
      allowed: true,
      flagged: true,
      reason:
        'Comentario publicado, pero marcado para revisión por posible lenguaje tóxico.',
    };
  }

  // Todo correcto
  return {
    allowed: true,
    flagged: false,
  };
}

export default function FeedPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentStatus, setCommentStatus] = useState<Record<string, string>>({});

  // Cargar sesión demo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const s = getSession();
      setSession(s as SessionData | null);
    } catch {
      // ignore
    }
  }, []);

  // Cargar posts + comentarios desde Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // 1) Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at')
        .order('created_at', { ascending: false });

      if (postsError || !postsData) {
        console.error('Error loading posts:', postsError);
        setPosts([]);
        setIsLoading(false);
        return;
      }

      const posts: Post[] = postsData.map((p: any) => ({
        id: p.id,
        image_url: p.image_url,
        caption: p.caption ?? null,
        created_at: p.created_at ?? null,
      }));

      // 2) Comentarios
      const postIds = posts.map((p) => p.id);
      let comments: Comment[] = [];

      if (postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('id, post_id, content, created_at, is_flagged')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (!commentsError && commentsData) {
          comments = commentsData.map((c: any) => ({
            id: c.id,
            post_id: c.post_id,
            content: c.content,
            created_at: c.created_at ?? null,
            is_flagged: c.is_flagged ?? null,
          }));
        }
      }

      // 3) Mezclar posts + comentarios
      const postsWithComments: FeedPost[] = posts.map((p) => ({
        ...p,
        comments: comments.filter((c) => c.post_id === p.id),
      }));

      setPosts(postsWithComments);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleCommentChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleSubmitComment = async (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    // Moderación "IA"
    const result = moderateComment(text);

    if (!result.allowed) {
      setCommentStatus((prev) => ({
        ...prev,
        [postId]: result.reason ?? 'Comentario bloqueado por moderación.',
      }));
      // Notificación de comentario bloqueado
      try {
        addNotification(
          'comment-blocked',
          'Tu comentario fue bloqueado por infringir las normas de Ethiqia.'
        );
      } catch {
        // ignore
      }
      return;
    }

    // Si está permitido, lo guardamos en Supabase
    const userId = session?.user?.id ?? null;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: text,
        is_flagged: result.flagged,
      })
      .select('id, post_id, content, created_at, is_flagged')
      .single();

    if (error || !data) {
      console.error('Error inserting comment:', error);
      setCommentStatus((prev) => ({
        ...prev,
        [postId]: 'Error al publicar el comentario en el backend.',
      }));
      return;
    }

    const newComment: Comment = {
      id: data.id,
      post_id: data.post_id,
      content: data.content,
      created_at: data.created_at ?? null,
      is_flagged: data.is_flagged ?? null,
    };

    // Actualizar estado local
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, newComment] }
          : p
      )
    );

    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: '',
    }));

    let statusMsg = 'Comentario publicado.';
    if (result.flagged && result.reason) {
      statusMsg = result.reason;
    }

    setCommentStatus((prev) => ({
      ...prev,
      [postId]: statusMsg,
    }));

    // Notificación de comentario aprobado
    try {
      addNotification(
        'comment-approved',
        'Tu comentario fue aprobado por la capa de moderación de Ethiqia.'
      );
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones analizadas en Ethiqia
          </h1>
          <p className="text-sm text-neutral-400">
            Este feed muestra imágenes subidas desde la demo en vivo, junto con
            sus comentarios moderados automáticamente. Los comentarios con
            lenguaje de odio, acoso o insultos fuertes se bloquean; otros se
            publican pero pueden marcarse para revisión.
          </p>
        </header>

        {isLoading && (
          <p className="text-xs text-neutral-500">
            Cargando publicaciones desde Supabase…
          </p>
        )}

        {!isLoading && posts.length === 0 && (
          <p className="text-sm text-neutral-400">
            Todavía no hay publicaciones. Sube una imagen desde la demo en vivo
            para ver aquí el flujo completo.
          </p>
        )}

        {!isLoading &&
          posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              {/* Imagen */}
              <div className="bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image_url}
                  alt={post.caption ?? 'Publicación Ethiqia'}
                  className="w-full max-h-[420px] object-cover"
                />
              </div>

              {/* Texto + meta */}
              <div className="p-4 space-y-3 text-sm">
                {post.caption && (
                  <p className="text-neutral-100">{post.caption}</p>
                )}
                {post.created_at && (
                  <p className="text-[11px] text-neutral-500">
                    Publicado el{' '}
                    {new Date(post.created_at).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>

              {/* Comentarios */}
              <div className="border-t border-neutral-800 px-4 py-3 space-y-3 text-xs">
                <p className="font-semibold text-neutral-100">
                  Comentarios moderados por IA
                </p>

                {/* Lista de comentarios */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {post.comments.length === 0 && (
                    <p className="text-[11px] text-neutral-500">
                      Aún no hay comentarios en esta publicación.
                    </p>
                  )}

                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-neutral-900 px-3 py-2 border border-neutral-800"
                    >
                      <p className="text-neutral-100 text-[13px]">
                        {c.content}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-500">
                        <span>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : ''}
                        </span>
                        {c.is_flagged && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-[1px] text-[10px] text-amber-300 border border-amber-500/50">
                            Marcado para revisión
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulario comentario */}
                <div className="pt-2 space-y-1">
                  <textarea
                    rows={2}
                    value={commentDrafts[post.id] || ''}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                    placeholder="Escribe un comentario (la IA bloqueará insultos y acoso)…"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-neutral-500">
                      La moderación detecta lenguaje de odio, insultos directos,
                      bullying y posible acoso, y puede bloquear o marcar
                      comentarios.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSubmitComment(post.id)}
                      className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-neutral-950 hover:bg-emerald-400"
                    >
                      Publicar comentario
                    </button>
                  </div>
                  {commentStatus[post.id] && (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {commentStatus[post.id]}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
