'use client';

import { useEffect, useState } from 'react';

type StoredPost = {
  id: string;
  imageUrl: string;
  score?: number;
  createdAt?: number;
};

type RenderPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
  authorName: string;
  authorSubtitle: string;
  aiProbability: number;
  authenticity: number;
  coherence: number;
};

type CommentStatus = 'idle' | 'checking' | 'approved' | 'blocked';

const DEMO_STATIC_POSTS: RenderPost[] = [
  {
    id: 'static-1',
    imageUrl: '/demo/profile-stock.jpg',
    score: 87,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    authorName: 'Ana (demo usuaria)',
    authorSubtitle:
      'Abogada. Usa Ethiqia para evitar suplantaciones de identidad en LinkedIn.',
    aiProbability: 18,
    authenticity: 86,
    coherence: 90,
  },
  {
    id: 'static-2',
    imageUrl: '/demo/profile-stock.jpg',
    score: 72,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    authorName: 'Carlos (demo usuario)',
    authorSubtitle:
      'Emprendedor. Quiere enseñar a inversores que sus fotos son reales.',
    aiProbability: 32,
    authenticity: 76,
    coherence: 80,
  },
];

function computeMetrics(score: number) {
  const safeScore = Math.max(0, Math.min(100, score));
  const authenticity = Math.max(
    0,
    Math.min(100, safeScore + 10) // un poco más alta
  );
  const aiProbability = Math.max(
    0,
    Math.min(100, 100 - safeScore + 5) // si score es alto, IA baja
  );
  const coherence = Math.max(
    0,
    Math.min(100, Math.round((authenticity + score) / 2))
  );
  return { authenticity, aiProbability, coherence };
}

const insultWords = [
  'idiota',
  'imbécil',
  'gilipollas',
  'estúpido',
  'puta',
  'mierda',
  'asco',
  'racista',
  'negro de mierda',
  'maricón',
  'subnormal',
];

function containsInsult(text: string) {
  const lower = text.toLowerCase();
  return insultWords.some((w) => lower.includes(w));
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

function PostCard({ post }: { post: RenderPost }) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<CommentStatus>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setStatus('checking');

    setTimeout(() => {
      if (containsInsult(comment)) {
        setStatus('blocked');
        // En una versión real aquí avisaríamos al backend y bajaríamos score.
      } else {
        setStatus('approved');
        // Podríamos guardar el comentario en localStorage si hace falta.
      }
    }, 800);
  };

  const { authenticity, aiProbability, coherence, score } = post;

  const aiLabel =
    aiProbability >= 70
      ? 'Alta probabilidad de IA'
      : aiProbability >= 40
      ? 'Probabilidad media de IA'
      : 'Baja probabilidad de IA';

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-6">
      {/* Cabecera */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold">
            {post.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-100">
              {post.authorName}
            </span>
            <span className="text-[11px] text-neutral-500">
              Usuario real · Demo local
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-neutral-500">
            {formatDate(post.createdAt)}
          </span>
          <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300">
            {aiLabel} ({aiProbability}%)
          </span>
        </div>
      </header>

      {/* Imagen */}
      <div className="bg-black">
        <img
          src={post.imageUrl}
          alt="Publicación Ethiqia"
          className="w-full max-h-[520px] object-cover"
        />
      </div>

      {/* Métricas + acciones */}
      <section className="px-4 py-3 space-y-3 text-sm">
        <p className="text-[13px] text-neutral-300">
          Ethiqia analiza autenticidad, probabilidad de IA y coherencia para
          calcular un Ethiqia Score entre 0 y 100.
        </p>

        {/* Score global */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Ethiqia Score global</span>
            <span className="font-semibold text-emerald-400">
              {score}/100
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Barras individuales */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Autenticidad</span>
              <span className="font-medium text-neutral-100">
                {authenticity}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${authenticity}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Prob. IA</span>
              <span className="font-medium text-neutral-100">
                {aiProbability}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${aiProbability}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Coherencia</span>
              <span className="font-medium text-neutral-100">
                {coherence}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${coherence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Acciones (like, comentar, guardar, compartir) */}
        <div className="flex items-center gap-4 pt-2 text-xs text-neutral-300">
          <button className="flex items-center gap-1 hover:text-emerald-400">
            <span>❤️</span>
            <span>Te gusta</span>
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-400">
            <span>💬</span>
            <span>Comentar</span>
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-400">
            <span>🏷️</span>
            <span>Guardado</span>
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-400">
            <span>📤</span>
            <span>Compartir</span>
          </button>
        </div>

        {/* Comentarios moderados por IA */}
        <div className="mt-3 border-t border-neutral-800 pt-3">
          <p className="text-[11px] text-neutral-500 mb-1">
            Comentar (moderado por IA)
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 text-xs"
          >
            <input
              type="text"
              placeholder="Escribe un comentario respetuoso…"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              className="flex-1 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-black hover:bg-emerald-400"
            >
              Publicar
            </button>
          </form>

          {status === 'checking' && (
            <p className="mt-1 text-[11px] text-neutral-400">
              Analizando comentario con la IA de Ethiqia…
            </p>
          )}
          {status === 'approved' && (
            <p className="mt-1 text-[11px] text-emerald-400">
              ✅ Comentario aprobado. No afecta negativamente a tu Ethiqia
              Score.
            </p>
          )}
          {status === 'blocked' && (
            <p className="mt-1 text-[11px] text-amber-400">
              ⚠️ Comentario bloqueado por lenguaje ofensivo. En una versión
              real, este tipo de acciones podría restar puntuación a tu Ethiqia
              Score.
            </p>
          )}
        </div>
      </section>
    </article>
  );
}

export default function FeedPage() {
  const [userPosts, setUserPosts] = useState<RenderPost[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (!raw) return;

      const parsed: StoredPost[] = JSON.parse(raw);
      const cleaned = parsed
        .filter((p) => p && p.imageUrl)
        .sort(
          (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
        )
        .map<RenderPost>((p, index) => {
          const score = p.score ?? 75;
          const { authenticity, aiProbability, coherence } =
            computeMetrics(score);
          return {
            id: p.id ?? `local-${index}`,
            imageUrl: p.imageUrl,
            score,
            createdAt: p.createdAt ?? Date.now(),
            authorName: 'Usuario Ethiqia',
            authorSubtitle: 'Usuario real · Demo local',
            authenticity,
            aiProbability,
            coherence,
          };
        });

      setUserPosts(cleaned);
    } catch (err) {
      console.error('Error leyendo feed local:', err);
    }
  }, []);

  const allPosts: RenderPost[] = [...userPosts, ...DEMO_STATIC_POSTS];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-6 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            FEED
          </p>
          <h1 className="text-2xl font-semibold">Feed de Ethiqia</h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Aquí se mezclan publicaciones reales subidas desde la demo en vivo y
            ejemplos preparados para explicar Ethiqia a inversores y al Parque
            Científico. No dependemos del backend: todo se guarda en este
            navegador.
          </p>
        </header>

        {allPosts.length === 0 && (
          <p className="text-sm text-neutral-500">
            Todavía no hay publicaciones en este navegador. Ve a{' '}
            <a
              href="/demo/live"
              className="text-emerald-400 underline underline-offset-2"
            >
              Demo &gt; Live
            </a>{' '}
            y sube tu primera imagen.
          </p>
        )}

        {allPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}
