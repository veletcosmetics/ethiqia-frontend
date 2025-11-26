'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import NotificationsBar from '../../components/demo/NotificationsBar';
import {
  DemoPost,
  loadDemoPosts,
  toggleLike,
  incrementComments,
} from '../../lib/demoStorage';

type CommentInputs = {
  [postId: string]: string;
};

type ModerationState = {
  [postId: string]: 'idle' | 'reviewing' | 'approved' | 'rejected';
};

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function probabilityLabel(p: number): { texto: string; clase: string } {
  if (p >= 70) {
    return {
      texto: 'Alta probabilidad de IA',
      clase: 'bg-rose-900/70 text-rose-200 border border-rose-500/70',
    };
  }
  if (p >= 40) {
    return {
      texto: 'Probabilidad media de IA',
      clase: 'bg-amber-900/70 text-amber-100 border border-amber-500/70',
    };
  }
  return {
    texto: 'Baja probabilidad de IA',
    clase: 'bg-emerald-900/70 text-emerald-100 border border-emerald-500/70',
  };
}

// Palabras prohibidas (puedes ampliar esta lista)
const BAD_WORDS = [
  'puta', 'puto', 'imbecil', 'idiota', 'mierda', 'asqueroso',
  'asquerosa', 'gilipollas', 'subnormal', 'racista', 'cerdo',
  'perra', 'zorra', 'cabrón', 'cabrón', 'estúpido'
];

function containsBadWords(text: string): boolean {
  const t = text.toLowerCase();
  return BAD_WORDS.some((w) => t.includes(w));
}

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<CommentInputs>({});
  const [moderation, setModeration] = useState<ModerationState>({});

  useEffect(() => {
    setPosts(loadDemoPosts());
  }, []);

  const handleLike = (postId: string) => {
    const updated = toggleLike(postId);
    setPosts(updated);
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleCommentSubmit = (postId: string) => {
    const text = (commentInputs[postId] ?? '').trim();
    if (!text) return;

    // Estado → Revisando
    setModeration((prev) => ({ ...prev, [postId]: 'reviewing' }));

    // Simulación de revisión IA
    setTimeout(() => {
      if (containsBadWords(text)) {
        // Comentario NO aprobado
        setModeration((prev) => ({ ...prev, [postId]: 'rejected' }));
        return;
      }

      // Comentario aprobado
      incrementComments(postId);
      setPosts(loadDemoPosts());

      setModeration((prev) => ({ ...prev, [postId]: 'approved' }));

      // Limpiar input
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

      // Ocultar la notificación visual de aprobado a los 2 segundos
      setTimeout(() => {
        setModeration((prev) => ({ ...prev, [postId]: 'idle' }));
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <NotificationsBar />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Feed (demo local)</h1>
            <p className="text-sm text-slate-400">
              Publicaciones generadas desde este navegador. Moderación automática activada.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <button
              onClick={() => {
                window.location.href = '/demo/live';
              }}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400"
            >
              Subir imagen (demo Live)
            </button>
            <span className="text-[11px] text-slate-500">
              {posts.length} publicaciones locales
            </span>
          </div>
        </header>

        {/* FEED */}
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">
            No hay publicaciones. Ve a <span className="text-emerald-300">/demo/live</span>.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const prob = probabilityLabel(post.aiProbability);
              const commentValue = commentInputs[post.id] ?? '';
              const state = moderation[post.id] ?? 'idle';

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold">
                        D
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-100">
                          David (demo usuario)
                        </div>
                        <div className="text-slate-400">
                          {formatDateTime(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-[11px] ${prob.clase}`}
                    >
                      {prob.texto}
                    </div>
                  </div>

                  {/* Imagen */}
                  <div className="relative h-[420px] w-full bg-black">
                    <Image
                      src={post.imageUrl}
                      alt="Publicación"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Texto demo */}
                  <div className="px-4 pt-3 text-sm text-slate-200">
                    <p>
                      Ana, abogada. Le interesa Ethiqia para evitar suplantaciones
                      de identidad con fotos falsas en perfiles profesionales.
                    </p>
                  </div>

                  {/* Score */}
                  <div className="px-4 pt-3 text-xs text-slate-300">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">Ethiqia Score global</span>
                      <span className="font-semibold text-emerald-300">
                        {post.score}/100
                      </span>
                    </div>
                    <div className="mb-3 h-1.5 w-full rounded-full bg-slate-800">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${post.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Interacciones */}
                  <div className="px-4 py-2 text-[11px] text-slate-300 border-t border-slate-800">
                    <div className="mb-1 flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 hover:text-emerald-300"
                      >
                        🤍 Te gusta
                      </button>
                      <button className="flex items-center gap-1 hover:text-slate-100">
                        💬 Comentar
                      </button>
                      <button className="flex items-center gap-1 hover:text-slate-100">
                        🔖 Guardado
                      </button>
                      <button className="ml-auto flex items-center gap-1 hover:text-slate-100">
                        📤 Compartir
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {post.likes} me gusta (demo) · {post.comments} comentarios
                    </div>
                  </div>

                  {/* Caja de comentarios */}
                  <div className="border-t border-slate-800 px-4 py-3 text-[11px]">
                    <div className="mb-1 text-slate-400">
                      Comentar (moderado por IA)
                    </div>

                    {/* Estado de moderación */}
                    {state === 'reviewing' && (
                      <div className="mb-2 text-amber-300">
                        Revisando comentario…
                      </div>
                    )}

                    {state === 'approved' && (
                      <div className="mb-2 text-emerald-300">
                        Comentario aprobado por IA.
                      </div>
                    )}

                    {state === 'rejected' && (
                      <div className="mb-2 text-rose-300">
                        Tu comentario ha sido bloqueado por lenguaje inapropiado.
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escribe un comentario respetuoso..."
                        value={commentValue}
                        onChange={(e) =>
                          handleCommentChange(post.id, e.target.value)
                        }
                        disabled={state === 'reviewing'}
                        className="h-8 flex-1 rounded-full border border-slate-700 bg-slate-950 px-3 text-[11px] text-slate-100 outline-none focus:border-emerald-400"
                      />

                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={state === 'reviewing'}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400 disabled:opacity-40"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
