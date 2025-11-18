'use client';

import { useEffect, useState } from 'react';

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
};

type StoredDemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
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
      };
      setDemoPost(item);
    } catch {
      // si falla el parse, ignoramos
    }
  }, []);

  const items = demoPost ? [demoPost, ...MOCK_FEED] : MOCK_FEED;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto max-w-xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Actividad en Ethiqia
          </h1>
          <p className="text-xs text-neutral-400">
            Versión demo del feed. Cada publicación combina la foto con su Ethiqia Score,
            probabilidad de que la imagen sea IA y acciones tipo Instagram: me gusta, comentarios
            y compartir.
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
  const [comments] = useState(() => (item.isDemo ? 3 : 11));

  const badge = getBadge(item.score);
  const initials = item.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const aiProb = item.aiProbability ?? 18;
  const aiBadge = getAiBadge(aiProb);

  function toggleLike() {
    setLiked((prev) => !prev);
    setLikes((prev) => prev + (liked ? -1 : 1));
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
      // Fallback simple para la demo
      try {
        void navigator.clipboard.writeText(window.location.href);
        // Podrías mostrar un pequeño mensaje visual aquí si quisieras.
      } catch {
        // ignoramos en la demo
      }
    }
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
          <p className="text-sm font-medium">
            {item.name}
            {item.isDemo && (
              <span className="ml-2 text-[10px] rounded-full bg-emerald-500/10 px-2 py-[1px] text-emerald-300 border border-emerald-500/40">
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

      {/* Imagen grande */}
      <div className="relative w-full bg-neutral-800 aspect-[4/5] overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-500/30 via-neutral-900 to-neutral-900" />
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
            className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-100"
          >
            <span>💬</span>
            <span>{comments} comentarios</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-100"
        >
          <span>↗︎</span>
          <span>Compartir</span>
        </button>
      </div>

      {/* Métricas: Ethiqia Score + probabilidad IA */}
      <footer className="px-4 py-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
      </footer>
    </article>
  );
}
