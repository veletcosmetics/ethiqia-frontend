'use client';

import { useEffect, useState } from 'react';

type StoredFeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

type BlockScore = {
  id: string;
  title: string;
  description: string;
  tip: string;
  value: number; // 0–100
};

type AggregatedScore = {
  globalScore: number;
  totalPosts: number;
  blocks: BlockScore[];
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveBlock(base: number, delta: number): number {
  return clampScore(base + delta);
}

function getColorForValue(value: number): string {
  if (value >= 75) return 'text-emerald-400';
  if (value >= 50) return 'text-amber-300';
  return 'text-red-400';
}

export default function ScorePage() {
  const [agg, setAgg] = useState<AggregatedScore | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (!raw) {
        const blocks = buildBlocksFromBase(0, 0);
        setAgg({
          globalScore: 0,
          totalPosts: 0,
          blocks,
        });
        return;
      }

      const data = JSON.parse(raw) as StoredFeedPost[];
      if (!Array.isArray(data) || data.length === 0) {
        const blocks = buildBlocksFromBase(0, 0);
        setAgg({
          globalScore: 0,
          totalPosts: 0,
          blocks,
        });
        return;
      }

      const totalPosts = data.length;
      const sum = data.reduce((acc, p) => acc + (p.score || 0), 0);
      const baseScore = sum / totalPosts;

      const blocks = buildBlocksFromBase(baseScore, totalPosts);

      setAgg({
        globalScore: clampScore(baseScore),
        totalPosts,
        blocks,
      });
    } catch {
      const blocks = buildBlocksFromBase(0, 0);
      setAgg({
        globalScore: 0,
        totalPosts: 0,
        blocks,
      });
    }
  }, []);

  const gaugeValue = agg?.globalScore ?? 0;
  const gaugeColorClass = getColorForValue(gaugeValue);

  // Logros simulados en función del score / posts
  const achievements = buildAchievements(agg);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            Reputación · Ethiqia Score
          </p>
          <h1 className="text-2xl font-semibold">
            Tu Ethiqia Score y sus bloques de reputación
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta vista resume tu reputación digital dentro de la demo de
            Ethiqia. El score global se compone de varios bloques: autenticidad
            visual, conducta, contribución comunitaria, transparencia,
            sostenibilidad e impacto, y reconocimiento externo. Todo lo que
            hagas en la demo suma o resta.
          </p>
        </header>

        {/* Score global */}
        <section className="grid gap-4 md:grid-cols-[1.2fr,1fr] items-stretch">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
            <p className="text-xs text-neutral-400">Ethiqia Score global</p>
            <div className="flex items-end gap-3">
              <span
                className={`text-5xl font-semibold ${gaugeColorClass}`}
              >
                {agg ? agg.globalScore : '—'}
              </span>
              <span className="mb-2 text-xs text-neutral-400">/100</span>
            </div>

            {/* Barra global simple */}
            <div className="mt-2 space-y-2">
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${gaugeValue}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                Este valor se calcula a partir de las publicaciones que has
                generado en la demo (por ejemplo desde{' '}
                <code className="bg-neutral-900 px-1 py-[1px] rounded text-[10px]">
                  /demo/live
                </code>
                ). En un entorno real, Ethiqia utilizaría estos bloques para
                tomar decisiones de confianza, visibilidad o verificación.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">
                Publicaciones analizadas
              </span>
              <span className="font-semibold text-neutral-100">
                {agg ? agg.totalPosts : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">
                Bloques de reputación activos
              </span>
              <span className="font-semibold text-neutral-100">6</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Cada bloque representa una dimensión distinta de tu reputación:
              autenticidad, conducta, contribución, transparencia, sostenibilidad
              y reconocimiento. El peso y las fórmulas son simulados en esta
              demo, pero ilustran cómo podría funcionar Ethiqia en producción.
            </p>
          </div>
        </section>

        {/* Bloques de reputación */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-200">
              Bloques de tu reputación Ethiqia
            </h2>
            <p className="text-[11px] text-neutral-500">
              Barra de rojo (baja puntuación) a verde (máxima puntuación). Al
              final se muestra tu valor actual sobre 100.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {agg?.blocks.map((block) => (
              <article
                key={block.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-100">
                      {block.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      {block.description}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${getColorForValue(
                      block.value
                    )}`}
                  >
                    {block.value}/100
                  </span>
                </div>

                {/* Barra de gradiente rellena según puntuación */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${block.value}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400">{block.tip}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Logros recientes */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-200">
            Logros recientes (demo)
          </h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 text-[11px] text-neutral-300">
            {achievements.length === 0 ? (
              <p className="text-neutral-500">
                Cuando generes algunas publicaciones en la demo, aquí aparecerán
                logros simulados: rachas sin toxicidad, primeras publicaciones
                analizadas o mejoras de score.
              </p>
            ) : (
              <ul className="space-y-1">
                {achievements.map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <span>{a.icon}</span>
                    <div>
                      <p className="text-neutral-200">{a.title}</p>
                      <p className="text-[10px] text-neutral-500">
                        {a.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Integraciones externas */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Futuras integraciones externas (APIs)
          </h2>
          <p>
            En versiones avanzadas, Ethiqia podrá conectar con aplicaciones
            externas mediante APIs (salud, sostenibilidad, educación,
            certificaciones, voluntariado...). Estas señales externas, siempre
            con consentimiento del usuario, alimentarían bloques concretos del
            Ethiqia Score (hábitos saludables, impacto ESG, reconocimiento
            profesional, etc.).
          </p>
          <p className="text-[11px] text-neutral-500">
            Ejemplos: pasos diarios verificados (Apple Health / Google Fit),
            acciones sostenibles registradas en apps de huella de carbono,
            credenciales profesionales emitidas por terceros, o voluntariado
            certificado. Ethiqia podría actuar como capa de reputación neutra,
            integrando estas señales en un score ético y explicable.
          </p>
        </section>

        {/* Nota conceptual */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Demo conceptual del sistema de reputación por bloques
          </h2>
          <p>
            En esta versión demo, los valores de cada bloque se calculan de
            forma aproximada a partir de tus publicaciones y del score medio.
            En un producto real, Ethiqia utilizaría señales específicas para
            cada bloque (autenticidad visual, conducta, impacto, evidencias,
            integraciones externas...) y ofrecería recomendaciones
            personalizadas para mejorar tu reputación digital de forma ética y
            transparente.
          </p>
          <p className="text-[11px] text-neutral-500">
            La idea clave: no hay un único número mágico. Tu reputación se
            construye por capas (bloques) y tú puedes entender qué mejorar en
            cada una.
          </p>
        </section>
      </section>
    </main>
  );
}

/**
 * Construye los 6 bloques de reputación a partir de un score base y el total de posts.
 * Todo es simulación lógica para la demo, pero mantiene coherencia numérica.
 */
function buildBlocksFromBase(baseScore: number, totalPosts: number): BlockScore[] {
  const safeBase = Number.isFinite(baseScore) ? baseScore : 0;

  // Pequeñas variaciones para que no todos los bloques sean iguales
  const authenticity = deriveBlock(safeBase, +5);
  const conduct = deriveBlock(safeBase, +2);
  const community = deriveBlock(safeBase, -3);
  const transparency = deriveBlock(safeBase, 0);
  const sustainability = deriveBlock(safeBase, -8);
  const recognition = deriveBlock(safeBase, totalPosts > 0 ? +4 : 0);

  const blocks: BlockScore[] = [
    {
      id: 'authenticity',
      title: 'Autenticidad visual',
      description:
        'Evalúa si tu contenido se presenta de forma clara, sin engaños y con un uso transparente de imágenes reales o generadas por IA.',
      tip:
        'Para mejorar este bloque, publica contenido coherente, etiqueta correctamente cuando uses IA y evita manipular imágenes de forma engañosa.',
      value: authenticity,
    },
    {
      id: 'conduct',
      title: 'Conducta digital',
      description:
        'Refleja el tono de tus interacciones: respeto, ausencia de hate y comportamiento constructivo en comentarios y respuestas.',
      tip:
        'Evita lenguaje tóxico, spam o ataques personales. Aporta contexto, soluciones y mantén un tono profesional y respetuoso.',
      value: conduct,
    },
    {
      id: 'community',
      title: 'Contribución comunitaria',
      description:
        'Mide en qué medida aportas valor a la comunidad: contenido útil, ayuda a otras personas y participación activa.',
      tip:
        'Comenta de forma útil, comparte aprendizajes y genera publicaciones que realmente aporten algo al resto de la comunidad.',
      value: community,
    },
    {
      id: 'transparency',
      title: 'Transparencia y coherencia',
      description:
        'Valora si tu narrativa digital es coherente en el tiempo: sin contradicciones evidentes ni mensajes opacos.',
      tip:
        'Mantén una línea clara en tus mensajes, evita cambios bruscos de discurso y sé transparente con tus proyectos y logros.',
      value: transparency,
    },
    {
      id: 'sustainability',
      title: 'Sostenibilidad e impacto positivo',
      description:
        'Integra señales vinculadas a sostenibilidad, impacto social y alineación con prácticas responsables.',
      tip:
        'Comparte acciones reales (aunque sean pequeñas) relacionadas con impacto positivo, sostenibilidad o proyectos sociales verificables. En el futuro, podrás conectar apps externas para que estas acciones se verifiquen automáticamente.',
      value: sustainability,
    },
    {
      id: 'recognition',
      title: 'Reconocimiento externo',
      description:
        'Tiene en cuenta validaciones externas: colaboraciones, menciones, certificaciones o respaldo de terceros.',
      tip:
        'En un futuro, este bloque crecerá con integraciones externas (empresas, instituciones, certificaciones). En la demo, se alimenta de tu actividad general.',
      value: recognition,
    },
  ];

  return blocks;
}

/**
 * Construye una lista de logros simulados en función del score y número de posts.
 */
function buildAchievements(
  agg: AggregatedScore | null
): { id: string; icon: string; title: string; description: string }[] {
  if (!agg) return [];

  const items: { id: string; icon: string; title: string; description: string }[] = [];

  if (agg.totalPosts > 0) {
    items.push({
      id: 'first-post',
      icon: '🏅',
      title: 'Primera publicación analizada',
      description:
        'Has generado al menos una publicación en la demo. Ethiqia ya puede empezar a calcular tu reputación.',
    });
  }

  if (agg.totalPosts >= 3) {
    items.push({
      id: 'several-posts',
      icon: '📈',
      title: 'Actividad consistente',
      description:
        'Has generado varias publicaciones. En un sistema real, la constancia ayuda a estabilizar tu score.',
    });
  }

  if (agg.globalScore >= 70) {
    items.push({
      id: 'good-score',
      icon: '⭐',
      title: 'Ethiqia Score notable',
      description:
        'Tu score global es superior a 70/100. En el futuro, esto podría desbloquear ventajas o verificaciones.',
    });
  }

  if (agg.globalScore >= 80 && agg.totalPosts >= 3) {
    items.push({
      id: 'high-score',
      icon: '🌱',
      title: 'Base sólida para integraciones externas',
      description:
        'Con un buen score y algo de actividad, tendría sentido conectar señales externas (salud, sostenibilidad, certificaciones) para reforzar tu reputación.',
    });
  }

  return items;
}
