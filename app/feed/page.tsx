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

type ToxicCategory =
  | 'hate'
  | 'violence'
  | 'bullying'
  | 'sexual'
  | 'self-harm'
  | 'other';

// Lista ampliada de insultos / odio / acoso
const TOXIC_KEYWORDS: { pattern: string; category: ToxicCategory }[] = [
  // Insultos generales / desprecio
  { pattern: 'gilipollas', category: 'bullying' },
  { pattern: 'subnormal', category: 'bullying' },
  { pattern: 'idiota', category: 'bullying' },
  { pattern: 'imbécil', category: 'bullying' },
  { pattern: 'cretino', category: 'bullying' },
  { pattern: 'payaso', category: 'bullying' },
  { pattern: 'mierda', category: 'bullying' },
  { pattern: 'asqueros', category: 'bullying' }, // asqueroso / asquerosa

  // Insultos fuertes / degradantes
  { pattern: 'puta', category: 'bullying' },
  { pattern: 'puto', category: 'bullying' },
  { pattern: 'zorra', category: 'bullying' },
  { pattern: 'perra', category: 'bullying' },
  { pattern: 'maricón', category: 'hate' },
  { pattern: 'maricona', category: 'hate' },

  // Racismo / xenofobia
  { pattern: 'sudaca', category: 'hate' },
  { pattern: 'negro de mierda', category: 'hate' },
  { pattern: 'panchito', category: 'hate' },
  { pattern: 'gitano de mierda', category: 'hate' },

  // Nazismo / odio político extremo
  { pattern: 'nazi', category: 'hate' },
  { pattern: 'hitler', category: 'hate' },
  { pattern: 'campos de concentración', category: 'hate' },

  // Amenazas directas
  { pattern: 'te voy a matar', category: 'violence' },
  { pattern: 'ojalá te mueras', category: 'self-harm' },
  { pattern: 'te voy a partir la cara', category: 'violence' },
  { pattern: 'te voy a encontrar', category: 'violence' },

  // Acoso directo
  { pattern: 'no vales nada', category: 'bullying' },
  { pattern: 'nadie te quiere', category: 'bullying' },
  { pattern: 'deberías desaparecer', category: 'self-harm' },
];

// Analizador “tipo IA” local (reglas + categorías)
function analyzeComment(text: string): {
  blocked: boolean;
  category?: ToxicCategory;
  reason?: string;
} {
  const lower = text.toLowerCase();

  // 1) Palabras/frases tóxicas conocidas
  for (const entry of TOXIC_KEYWORDS) {
    if (lower.includes(entry.pattern)) {
      switch (entry.category) {
        case 'hate':
          return {
            blocked: true,
            category: 'hate',
            reason:
              'Se ha detectado lenguaje de odio o discriminación (raza, género, orientación, etc.).',
          };
        case 'violence':
          return {
            blocked: true,
            category: 'violence',
            reason:
              'Se ha detectado una amenaza o incitación a la violencia hacia otra persona.',
          };
        case 'bullying':
          return {
            blocked: true,
            category: 'bullying',
            reason:
              'Se ha detectado lenguaje de acoso, insultos directos o degradación personal.',
          };
        case 'self-harm':
          return {
            blocked: true,
            category: 'self-harm',
            reason:
              'Se ha detectado un contenido que puede incitar o desear daño hacia otra persona.',
          };
        case 'sexual':
          return {
            blocked: true,
            category: 'sexual',
            reason:
              'Se ha detectado lenguaje sexual explícito inapropiado para Ethiqia.',
          };
        default:
          return {
            blocked: true,
            category: 'other',
            reason:
              'El comentario infringe las normas de Ethiqia (odio, acoso o violencia).',
          };
      }
    }
  }

  // 2) Heurística simple (tono muy agresivo)
  const exclamations = (text.match(/!/g) || []).length;
  const uppercaseWords = text
    .split(' ')
    .filter((w) => w.length > 3 && w === w.toUpperCase()).length;

  if (exclamations >= 4 && uppercaseWords >= 2) {
    return {
      blocked: true,
      category: 'bullying',
      reason:
        'El comentario parece muy agresivo (muchos gritos y énfasis). Reescríbelo en un tono más constructivo.',
    };
  }

  // 3) Si pasa todo, se considera apto
  return { blocked: false };
}

function computeScoreFromId(id: string): number {
  let acc = 0;
  for (const ch of id) acc += ch.charCodeAt(0);
  // 60–100
  return 60 + (acc % 41);
}

// ✅ POSTS DEMO (no tocan Supabase, solo frontend)
// Usan imágenes de /public/demo. Por ahora usamos profile-stock.jpg
const DEMO_FEED_POSTS: FeedPost[] = [
  {
    id: 'demo-1',
    imageUrl: '/demo/profile-stock.jpg',
    caption: 'Studio Nébula · Presentando su nueva línea de cosmética sostenible verificada en Ethiqia.',
    createdAt: new Date('2024-05-10T10:00:00Z').toISOString(),
    score: 92,
  },
  {
    id: 'demo-2',
    imageUrl: '/demo/profile-stock.jpg',
    caption: 'Lumis Health Lab · Compartiendo resultados de un estudio clínico aprobado por su comité ético.',
    createdAt: new Date('2024-05-12T16:30:00Z').toISOString(),
    score: 88,
  },
  {
    id: 'demo-3',
    imageUrl: '/demo/profile-stock.jpg',
    caption: 'GreenWave Impact · Proyecto de regeneración de litoral con seguimiento público de métricas.',
    createdAt: new Date('2024-05-13T09:15:00Z').toISOString(),
    score: 90,
  },
  {
    id: 'demo-4',
    imageUrl: '/demo/profile-stock.jpg',
    caption: 'Nova Legal Tech · Explicando de forma transparente cómo usan IA respetando la privacidad.',
    createdAt: new Date('2024-05-14T19:45:00Z').toISOString(),
    score: 85,
  },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setModerationMsg((prev) => ({ ...prev, [postId]: null }));
  };

  const handleCommentSubmit = (postId: string) => {
    const raw = (pendingComment[postId] || '').trim();
    if (!raw) return;

    // “IA” local: analiza el texto y decide si se bloquea
    const analysis = analyzeComment(raw);

    if (analysis.blocked) {
      const reason =
        analysis.reason ||
        'Tu comentario ha sido bloqueado por infringir las normas de Ethiqia.';

      setModerationMsg((prev) => ({
        ...prev,
        [postId]: reason,
      }));

      try {
        addNotification(
          'comment-blocked',
          'Tu comentario fue bloqueado por infringir las normas de Ethiqia.'
        );
      } catch {
        // no rompemos la app si falla
      }

      return;
    }

    // Si pasa el filtro, se añade al listado local (no backend)
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
      // ignoramos errores
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

  // 👇 AQUÍ DECIDIMOS QUÉ MOSTRAR:
  // Si hay posts reales -> usamos esos.
  // Si no hay ninguno -> mostramos solo los DEMO_FEED_POSTS.
  const displayPosts = posts.length > 0 ? posts : DEMO_FEED_POSTS;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Feed
          </p>
          <h1 className="text-2xl font-semibold">
            Publicaciones en Ethiqia (demo + reales)
          </h1>
          <p className="text-sm text-neutral-400">
            Si hay publicaciones reales subidas desde la demo en vivo, se
            muestran primero. Si no, verás un feed simulado con ejemplos de
            empresas y proyectos para explicar Ethiqia a inversores y al Parque
            Científico.
          </p>
        </header>

        {error && posts.length === 0 && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {displayPosts.map((post) => {
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
