'use client';

import { useEffect, useState, FormEvent } from 'react';

type ProfileType = 'persona' | 'organizacion';

type FeedItem = {
  id: string;
  name: string;
  type: ProfileType;
  country: string;
  sector: string;
  score: number;        // Ethiqia Score
  bio: string;
  image?: string;
  isDemo?: boolean;     // viene de tu perfil
  aiProbability?: number; // % prob. de que sea IA (demo)
  verified?: boolean;   // perfil verificado Ethiqia
};

type StoredDemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

type Comment = {
  id: string;
  text: string;
  status: 'pending' | 'approved' | 'blocked';
};

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    name: 'Studio Nébula',
    type: 'organizacion',
    country: 'España',
    sector: 'Innovación & I+D',
    score: 86,
    bio: 'Estudio de innovación especializado en cosmética, biotech y proyectos deeptech.',
    image: '/demo/studio-nebula.jpg',
    aiProbability: 14,
    verified: true,
  },
  {
    id: '2',
    name: 'David Guirao',
    type: 'persona',
    country: 'España',
    sector: 'Emprendimiento · Cosmética & IA',
    score: 78,
    bio: 'Fundador de Velet y Ethiqia. Proyectos en internacionalización, I+D y regulación.',
    image: '/demo/david-guirao.jpg',
    aiProbability: 22,
    verified: true,
  },
  {
    id: '3',
    name: 'Lumis Health Lab',
    type: 'organizacion',
    country: 'Portugal',
    sector: 'Healthtech',
    score: 92,
    bio: 'Startup de salud digital con foco en métricas de adherencia terapéutica.',
    image: '/demo/lumis-health.jpg',
    aiProbability: 9,
    verified: true,
  },
  {
    id: '4',
    name: 'Ana López',
    type: 'persona',
    country: 'Chile',
    sector: 'Finanzas & Impacto social',
    score: 64,
    bio: 'Consultora en financiación pública y privada para proyectos de impacto.',
    image: '/demo/ana-lopez.jpg',
    aiProbability: 37,
    verified: false,
  },
];

function getBadge(score: number) {
  if (score >= 80) {
    return {
      label: 'Alta confianza',
      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    };
  }
  if (score >= 60) {
    return {
      label: 'Confianza moderada',
      color: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    };
  }
  return {
    label: 'Riesgo elevado',
    color: 'bg-red-500/10 text-red-300 border-red-500/40',
  };
}

function getAiBadge(prob: number) {
  if (prob <= 20) {
    return {
      label: 'Baja prob. IA',
      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    };
  }
  if (prob <= 60) {
    return {
      label: 'Prob. IA moderada',
      color: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    };
  }
  return {
    label: 'Alta prob. IA',
    color: 'bg-red-500/10 text-red-300 border-red-500/40',
  };
}

export default function FeedPage() {
  const [demoPost, setDemoPost] = useState<FeedItem | null>(null);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('ethiqia_demo_post');
    if (!raw) return;
    try {
      const data: StoredDemoPost = JSON.parse(raw);
      if (!data.imageUrl) return;

      // Probabilidad IA demo calculada a partir del score para que parezca coherente
      const baseAi = 100 - data.score;
      const aiProb = Math.min(95, Math.max(5, baseAi * 0.6 + 10));

      const item: FeedItem = {
        id: 'demo',
        name: data.name || 'Tu perfil Ethiqia',
        type: 'persona',
        country: 'Demo',
        sector: 'Perfil Ethiqia',
        score: data.score,
        bio: 'Publicación generada desde tu perfil para la demo de Ethiqia.',
        image: data.imageUrl,
        isDemo: true,
        aiProbability: Math.round(aiProb),
        verified: true,
      };
      setDemoPost(item);
    } catch {
      // si falla el parse, ignoramos
    }
  }, []);

  const items = demoPost ? [demoPost, ...MOCK_FEED] : MOCK_FEED;

  const mainBgClass = isLight ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-950 text-neutral-50';
  const sectionBgClass = isLight ? 'bg-neutral-50' : 'bg-neutral-950';

  return (
    <main className={`min-h-[calc(100vh-64px)] ${mainBgClass}`}>
      <section className={`mx-auto max-w-xl px-4 py-8 space-y-6 ${sectionBgClass}`}>
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                Feed
              </p>
              <h1 className="text-2xl font-semibold">
                Actividad en Ethiqia
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsLight(v => !v)}
              className="text-xs rounded-full border border-neutral-700 px-3 py-1.5 hover:border-neutral-500"
            >
              {isLight ? '🌙 Modo oscuro' : '🔆 Modo claro'}
            </button>
          </div>

          <p className="text-xs text-neutral-400">
            Versión demo del feed. Cada publicación combina la foto con su Ethiqia Score,
            probabilidad de que la imagen sea IA y acciones tipo Instagram: me gusta, comentarios
            moderados por IA y compartir.
          </p>
        </header>

        <div className="space-y-6 pb-10">
          {items.map((item) => (
            <PostCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

/* --- Componente de tarjeta tipo Instagram --- */

type PostCardProps = {
  item: FeedItem;
};

function PostCard({ item }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(() => (item.isDemo ? 12 : 48));
  const [baseComments] = useState(() => (item.isDemo ? 3 : 11));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);

  const badge = getBadge(item.score);
  const initials = item.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const aiProb = item.aiProbability ?? 18;
  const aiBadge = getAiBadge(aiProb);

  const totalComments = baseComments + comments.length;

  function toggleLike() {
    setLiked((prev) => !prev);
    setLikes((prev) => prev + (liked ? -1 : 1));
  }

  function handleDoubleTap() {
    if (!liked) {
      setLiked(true);
      setLikes(prev => prev + 1);
    }
    setShowBigHeart(true);
    setTimeout(() => setShowBigHeart(false), 700);
  }

  function handleShare() {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      navigator
        .share({
          title: 'Ethiqia',
          text: `Échale un ojo al perfil de ${item.name} en Ethiqia.`,
          url: window.location.href,
        })
        .catch(() => {
          // si el usuario cancela, no hacemos nada
        });
    } else {
      try {
        void navigator.clipboard.writeText(window.location.href);
      } catch {
        // ignoramos en la demo
      }
    }
  }

  function handleAddComment(e: FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const newComment: Comment = {
      id: String(Date.now()),
      text,
      status: 'pending',
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText('');

    // Simular moderación por IA
    setTimeout(() => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== newComment.id) return c;

          const lower = c.text.toLowerCase();

          // Lista básica de insultos para la demo
          const offensiveWords = [
            'tonto',
            'idiota',
            'estupido',
            'estúpido',
            'imbecil',
            'imbécil',
            'gilipollas',
            'payaso',
          ];

          const seemsOffensive = offensiveWords.some(word => lower.includes(word));

          return {
            ...c,
            status: seemsOffensive ? 'blocked' : 'approved',
          };
        }),
      );
    }, 1000);
  }

  function commentAvatarColor(id: string) {
    // Colores sencillos para avatares de comentarios
    const colors = ['bg-emerald-500/30', 'bg-sky-500/30', 'bg-violet-500/30', 'bg-amber-500/30'];
    const index = Math.abs(hashString(id)) % colors.length;
    return colors[index];
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80">
      {/* Cabecera tipo Instagram */}
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-[11px] font-semibold overflow-hidden">
          {item.image && item.isDemo ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium flex items-center gap-1">
            {item.name}
            {item.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[1px] text-[10px] text-emerald-300 border border-emerald-500/40">
                ✓ Verificado
              </span>
            )}
            {item.isDemo && (
              <span className="ml-1 text-[10px] rounded-full bg-neutral-800 px-2 py-[1px] text-neutral-300 border border-neutral-600">
                Demo
              </span>
            )}
          </p>
          <p className="text-[11px] text-neutral-400">
            {item.type === 'persona' ? 'Perfil personal' : 'Organización'} · {item.country}
          </p>
        </div>
        <span className="rounded-full bg-neutral-800 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-neutral-300">
          {item.type === 'persona' ? 'Persona' : 'Org'}
        </span>
      </header>

      {/* Imagen grande con doble tap */}
      <div
        className="relative w-full bg-neutral-800 aspect-[4/5] overflow-hidden cursor-pointer"
        onDoubleClick={handleDoubleTap}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-500/30 via-neutral-900 to-neutral-900" />
        )}

        {showBigHeart && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-pulse">❤️</span>
          </div>
        )}
      </div>

      {/* Acciones tipo Instagram */}
      <div className="flex items-center justify-between px-4 pt-3 text-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLike}
            className="inline-flex items-center gap-1 text-sm hover:text-emerald-300"
          >
            <span className={liked ? 'scale-110' : ''}>{liked ? '❤️' : '🤍'}</span>
            <span className="text-xs">{likes} me gusta</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-100"
          >
            <span>💬</span>
            <span>{totalComments} comentarios</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(v => !v)}
            className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-100"
          >
            <span>{saved ? '★' : '☆'}</span>
            <span>{saved ? 'Guardado' : 'Guardar'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-100"
          >
            <span>↗︎</span>
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Métricas: Ethiqia Score + probabilidad IA */}
      <footer className="px-4 py-3 space-y-2 text-sm">
        <div className "flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold leading-none">
              {item.score}
            </span>
            <span className="text-[11px] text-neutral-400">
              Ethiqia Score
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{aiProb}%</span>
            <span className="text-[11px] text-neutral-400">
              prob. de imagen IA
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${aiBadge.color}`}
          >
            {aiBadge.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAnalysis(v => !v)}
          className="mt-1 text-[11px] text-emerald-300 hover:text-emerald-200"
        >
          {showAnalysis ? 'Ocultar análisis de imagen ▲' : 'Ver análisis de imagen (demo IA) ▼'}
        </button>

        {showAnalysis && (
          <div className="mt-1 rounded-md border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-[11px] space-y-1">
            <p className="text-neutral-300 font-medium">Resumen IA sobre la imagen</p>
            <p className="text-neutral-400">
              • Autenticidad percibida: {100 - Math.round(aiProb / 1.3)} / 100
            </p>
            <p className="text-neutral-400">
              • Riesgo de manipulación: {Math.round(aiProb * 0.7)} / 100
            </p>
            <p className="text-neutral-400">
              • Coherencia con el perfil: {Math.round(item.score * 0.85)} / 100
            </p>
            <p className="text-neutral-500">
              Estos valores están simulados para la demo, pero representan cómo Ethiqia puede
              evaluar imágenes con IA en producción.
            </p>
          </div>
        )}

        <p className="text-neutral-300 text-sm">
          {item.bio}
        </p>

        {item.isDemo && (
          <p className="text-[11px] text-emerald-300">
            Publicación de demostración generada desde tu perfil. Ideal para enseñar Ethiqia a
            inversores o convocatorias.
          </p>
        )}

        {!item.isDemo && (
          <p className="text-[11px] text-neutral-500">
            Vista de demostración: el contenido está simulado, pero la interacción y el diseño
            representan cómo será el feed real de Ethiqia.
          </p>
        )}

        {/* Zona de comentarios moderados por IA */}
        {showComments && (
          <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
            <p className="text-[11px] text-neutral-400">
              Los comentarios se moderan automáticamente: no se permiten insultos, mensajes
              ofensivos ni contenido racista. La IA analiza y valida cada mensaje antes de
              publicarlo.
            </p>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400"
              >
                Enviar
              </button>
            </form>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-[11px]">
                  <div
                    className={`mt-[2px] h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${commentAvatarColor(
                      c.id,
                    )}`}
                  >
                    T
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200">
                      <span className="font-medium mr-1">Tú:</span>
                      <span
                        className={
                          c.status === 'blocked'
                            ? 'line-through text-red-300/80'
                            : ''
                        }
                      >
                        {c.text}
                      </span>
                    </p>
                    {c.status === 'pending' && (
                      <p className="text-[10px] text-amber-300">
                        IA revisando tu comentario...
                      </p>
                    )}
                    {c.status === 'approved' && (
                      <p className="text-[10px] text-emerald-300">
                        Comentario verificado por la IA ✓
                      </p>
                    )}
                    {c.status === 'blocked' && (
                      <p className="text-[10px] text-red-300 font-medium">
                        Comentario no publicado por infringir las normas.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-[11px] text-neutral-500">
                  Aún no hay comentarios moderados en esta publicación.
                </p>
              )}
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}

/* Utilidad simple para colores de avatar de comentario */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function commentAvatarColor(id: string) {
  const colors = [
    'bg-emerald-500/30',
    'bg-sky-500/30',
    'bg-violet-500/30',
    'bg-amber-500/30',
  ];
  const index = Math.abs(hashString(id)) % colors.length;
  return colors[index];
}
