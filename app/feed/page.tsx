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

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<CommentInputs>({});

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
    const updated = incrementComments(postId);
    setPosts(updated);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <NotificationsBar />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        {/* Cabecera */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Feed (demo local)</h1>
            <p className="text-sm text-slate-400">
              Publicaciones generadas desde la demo de Ethiqia en este
              navegador. No es un feed real de usuarios.
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

        {/* Lista de posts */}
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">
            Todavía no hay publicaciones. Ve a{' '}
            <span className="text-emerald-300">/demo/live</span> para subir tu
            primera imagen.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const prob = probabilityLabel(post.aiProbability);
              const commentValue = commentInputs[post.id] ?? '';

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
                >
                  {/* Cabecera del post */}
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
                      alt="Publicación Ethiqia"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Texto descriptivo (demo) */}
                  <div className="px-4 pt-3 text-sm text-slate-200">
                    <p>
                      Ana, abogada. Le interesa Ethiqia para evitar suplantaciones
                      de identidad con fotos falsas en perfiles profesionales.
                    </p>
                  </div>

                  {/* Score y barras */}
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Autenticidad</span>
                        <span>{post.authenticity}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400"
                          style={{ width: `${post.authenticity}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span>Prob. IA</span>
                        <span>{post.aiProbability}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-amber-400"
                          style={{ width: `${post.aiProbability}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span>Coherencia</span>
                        <span>{post.coherence}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-sky-400"
                          style={{ width: `${post.coherence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de interacción */}
                  <div className="mt-3 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-300">
                    <div className="mb-1 flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 hover:text-emerald-300"
                      >
                        <span>🤍</span>
                        <span>Te gusta</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-slate-100">
                        <span>💬</span>
                        <span>Comentar</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-slate-100">
                        <span>🔖</span>
                        <span>Guardado</span>
                      </button>
                      <button className="ml-auto flex items-center gap-1 hover:text-slate-100">
                        <span>📤</span>
                        <span>Compartir</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {post.likes} me gusta (demo, no es contador real) ·{' '}
                      {post.comments} comentarios
                    </div>
                  </div>

                  {/* Caja de comentario */}
                  <div className="border-t border-slate-800 px-4 py-3 text-[11px]">
                    <div className="mb-1 text-slate-400">
                      Comentar (moderado por IA)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escribe un comentario respetuoso..."
                        value={commentValue}
                        onChange={(e) =>
                          handleCommentChange(post.id, e.target.value)
                        }
                        className="h-8 flex-1 rounded-full border border-slate-700 bg-slate-950 px-3 text-[11px] text-slate-100 outline-none focus:border-emerald-400"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
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
