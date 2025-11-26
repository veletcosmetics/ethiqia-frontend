'use client';

import { useEffect, useState } from 'react';

type DemoPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
  caption?: string;
  authenticity?: number;
  aiProbability?: number;
  coherence?: number;
};

type Comment = {
  id: string;
  text: string;
  createdAt: number;
};

type CommentsByPost = Record<string, Comment[]>;
type DraftsByPost = Record<string, string>;
type FlagsByPost = Record<string, boolean>;
type StatusByPost = Record<string, string | null>;

const STORAGE_KEY_FEED = 'ethiqia_feed_posts';
const STORAGE_KEY_COMMENTS = 'ethiqia_comments_v1';

// --- Helpers para posts ---

function loadLocalPosts(): DemoPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEED);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// --- Helpers para comentarios ---

function loadComments(): CommentsByPost {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return {};
    return data as CommentsByPost;
  } catch {
    return {};
  }
}

function saveComments(comments: CommentsByPost) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  } catch (e) {
    console.error('Error guardando comentarios en localStorage:', e);
  }
}

// Lista básica de insultos / palabras tóxicas (demo)
const TOXIC_PATTERNS = [
  'tonto',
  'idiota',
  'imbécil',
  'subnormal',
  'puta',
  'gilipollas',
  'mierda',
  'asco de',
  'vete a la mierda',
  'maricón',
  'negro de mierda',
  'puta mierda',
  'ojalá te mueras',
  'violarte',
  'violencia',
];

// Devuelve true si el comentario se considera tóxico
function isToxicComment(text: string): boolean {
  const normalized = text.toLowerCase();
  return TOXIC_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);
  const [comments, setComments] = useState<CommentsByPost>({});
  const [drafts, setDrafts] = useState<DraftsByPost>({});
  const [isModerating, setIsModerating] = useState<FlagsByPost>({});
  const [statusMsg, setStatusMsg] = useState<StatusByPost>({});

  // Cargar posts + comentarios al montar
  useEffect(() => {
    const list = loadLocalPosts().sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );
    setPosts(list);
    setComments(loadComments());
  }, []);

  // Handlers de comentario

  const handleDraftChange = (postId: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handlePublishComment = (postId: string) => {
    const text = (drafts[postId] || '').trim();
    if (!text) return;

    // Limpiar mensajes previos
    setStatusMsg((prev) => ({ ...prev, [postId]: null }));
    setIsModerating((prev) => ({ ...prev, [postId]: true }));

    // Simular tiempo de análisis IA
    setTimeout(() => {
      const toxic = isToxicComment(text);

      if (toxic) {
        // Comentario bloqueado: no se guarda
        setIsModerating((prev) => ({ ...prev, [postId]: false }));
        setStatusMsg((prev) => ({
          ...prev,
          [postId]:
            'Comentario bloqueado por la IA de Ethiqia. No se ha publicado y penaliza tu Ethiqia Score (demo).',
        }));
        return;
      }

      // Comentario aprobado: lo guardamos
      const newComment: Comment = {
        id: `c-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        createdAt: Date.now(),
      };

      setComments((prev) => {
        const prevForPost = prev[postId] || [];
        const updated: CommentsByPost = {
          ...prev,
          [postId]: [...prevForPost, newComment],
        };
        // Persistir en localStorage
        saveComments(updated);
        return updated;
      });

      // Limpiar estado del post
      setDrafts((prev) => ({ ...prev, [postId]: '' }));
      setIsModerating((prev) => ({ ...prev, [postId]: false }));
      setStatusMsg((prev) => ({
        ...prev,
        [postId]: 'Comentario aprobado y publicado (demo).',
      }));
    }, 800);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Feed de Ethiqia (demo local)</h1>
          <p className="text-sm text-neutral-400">
            Aquí solo se muestran las imágenes que has subido desde{' '}
            <code>/demo/live</code> en este navegador. Todo está guardado en{' '}
            <code>localStorage</code>, sin backend ni Supabase.
          </p>
        </header>

        {posts.length === 0 && (
          <p className="text-sm text-neutral-500 mt-6">
            Aún no hay publicaciones locales. Sube tu primera foto en{' '}
            <span className="font-semibold text-emerald-400">Demo &gt; Live</span>.
          </p>
        )}

        <div className="space-y-6">
          {posts.map((post) => {
            const auth = post.authenticity ?? 75;
            const aiProb = post.aiProbability ?? 30;
            const coh = post.coherence ?? 80;
            const postComments = comments[post.id] || [];
            const draft = drafts[post.id] || '';
            const moderating = isModerating[post.id] || false;
            const status = statusMsg[post.id] || null;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-900/80"
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold">
                      U
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-100">
                        Usuario Ethiqia
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Usuario demo · LocalStorage
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-neutral-500">
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-[11px] text-amber-300">
                      Prob. IA estimada · {aiProb}%
                    </span>
                  </div>
                </div>

                {/* Imagen */}
                <div className="bg-black">
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Publicación Ethiqia'}
                    className="max-h-[520px] w-full object-contain bg-black"
                  />
                </div>

                {/* Texto + métricas */}
                <div className="px-4 py-3 space-y-3">
                  {post.caption && (
                    <p className="text-sm text-neutral-100">{post.caption}</p>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-neutral-400">
                      Ethiqia Score global
                    </p>
                    <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(post.score ?? 0, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-neutral-300 flex justify-between">
                      <span>Score</span>
                      <span className="font-semibold text-emerald-400">
                        {post.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Barras detalladas */}
                  <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Autenticidad</span>
                        <span className="font-medium text-neutral-100">
                          {auth}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${auth}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Prob. IA</span>
                        <span className="font-medium text-neutral-100">
                          {aiProb}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${aiProb}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-300">Coherencia</span>
                        <span className="font-medium text-neutral-100">
                          {coh}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${coh}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Acciones simples */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>❤️</span>
                      <span>Te gusta</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>💬</span>
                      <span>Comentar</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>📎</span>
                      <span>Guardado</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-emerald-400">
                      <span>📤</span>
                      <span>Compartir</span>
                    </button>
                  </div>

                  {/* Comentarios */}
                  <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3">
                    <p className="text-xs text-neutral-400">
                      Comentar <span className="text-[11px]">(moderado por IA)</span>
                    </p>

                    {/* Lista de comentarios */}
                    {postComments.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {postComments.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg bg-neutral-900/80 px-3 py-2 text-xs"
                          >
                            <p className="text-neutral-100">{c.text}</p>
                            <p className="mt-1 text-[10px] text-neutral-500">
                              {formatDate(c.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Caja de comentario */}
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={2}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-emerald-500"
                        placeholder="Escribe un comentario respetuoso..."
                        value={draft}
                        onChange={(e) =>
                          handleDraftChange(post.id, e.target.value)
                        }
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-neutral-500">
                          {moderating
                            ? 'Analizando comentario con la IA de Ethiqia…'
                            : status || 'La IA bloqueará insultos y odio en esta demo.'}
                        </p>
                        <button
                          className="shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-60"
                          onClick={() => handlePublishComment(post.id)}
                          disabled={moderating || !draft.trim()}
                        >
                          Publicar
                        </button>
                      </div>
                    </div>
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
