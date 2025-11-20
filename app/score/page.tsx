'use client';

import { useEffect, useState } from 'react';

type StoredFeedPost = {
  id: string;
  imageUrl: string;
  score: number;
  createdAt: number;
};

type AggregatedScore = {
  averageScore: number;
  totalPosts: number;
  latestScore?: number;
};

export default function ScorePage() {
  const [agg, setAgg] = useState<AggregatedScore | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('ethiqia_feed_posts');
      if (!raw) {
        setAgg({
          averageScore: 0,
          totalPosts: 0,
        });
        return;
      }
      const data = JSON.parse(raw) as StoredFeedPost[];
      if (!Array.isArray(data) || data.length === 0) {
        setAgg({
          averageScore: 0,
          totalPosts: 0,
        });
        return;
      }

      const totalPosts = data.length;
      const sum = data.reduce((acc, p) => acc + (p.score || 0), 0);
      const averageScore = Math.round(sum / totalPosts);
      const latest = data[0];

      setAgg({
        averageScore,
        totalPosts,
        latestScore: latest?.score,
      });
    } catch {
      setAgg({
        averageScore: 0,
        totalPosts: 0,
      });
    }
  }, []);

  const gaugeColor =
    (agg?.averageScore || 0) >= 75
      ? 'bg-emerald-500'
      : (agg?.averageScore || 0) >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Score global
          </p>
          <h1 className="text-2xl font-semibold">Tu Ethiqia Score</h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Resumen del rendimiento de tus publicaciones en la demo: media de
            Ethiqia Score, número de posts analizados y último resultado. Ideal
            para explicar el concepto de reputación digital a inversores.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {/* Tarjeta principal */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
            <p className="text-xs text-neutral-400">Ethiqia Score medio</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold text-emerald-400">
                {agg ? agg.averageScore : '—'}
              </span>
              <span className="mb-1 text-xs text-neutral-400">/100</span>
            </div>

            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden mt-2">
              <div
                className={`h-full ${gaugeColor}`}
                style={{ width: `${agg?.averageScore || 0}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              Este valor combina autenticidad, coherencia y probabilidad de IA
              de todas tus publicaciones analizadas en la demo.
            </p>
          </div>

          {/* Detalle lateral */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Publicaciones analizadas</span>
              <span className="font-semibold text-neutral-100">
                {agg ? agg.totalPosts : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Último Ethiqia Score</span>
              <span className="font-semibold text-neutral-100">
                {agg?.latestScore ?? '—'}/100
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Cada vez que subes una imagen en{' '}
              <code className="bg-neutral-900 px-1 py-[1px] rounded text-[10px]">
                /demo/live
              </code>{' '}
              se actualizan estos datos. En un entorno real, Ethiqia podría
              usar este score para conceder insignias de confianza o límites de
              visibilidad.
            </p>
          </div>
        </section>

        {/* Explicación conceptual */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cómo se calcula el Ethiqia Score en la demo
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              El score de cada publicación se calcula a partir de autenticidad,
              coherencia y probabilidad de IA simuladas.
            </li>
            <li>
              El score medio es la media aritmética de todas tus publicaciones.
            </li>
            <li>
              En producción, este score podría incorporar también denuncias de
              la comunidad, señales de comportamiento y verificaciones
              externas.
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
