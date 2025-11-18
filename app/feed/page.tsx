'use client';

import { useState } from 'react';

type ProfileType = 'persona' | 'organizacion';

type FeedItem = {
  id: string;
  name: string;
  type: ProfileType;
  country: string;
  sector: string;
  score: number;
  bio: string;
};

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    name: 'Studio Nébula',
    type: 'organizacion',
    country: 'España',
    sector: 'Desarrollo de producto & I+D',
    score: 86,
    bio: 'Estudio de innovación especializado en cosmética, biotech y proyectos deeptech.',
  },
  {
    id: '2',
    name: 'David Guirao',
    type: 'persona',
    country: 'España',
    sector: 'Emprendimiento · Cosmética & IA',
    score: 78,
    bio: 'Fundador de Velet y Ethiqia. Proyectos en internacionalización, I+D y regulación.',
  },
  {
    id: '3',
    name: 'Lumis Health Lab',
    type: 'organizacion',
    country: 'Portugal',
    sector: 'Healthtech',
    score: 92,
    bio: 'Startup de salud digital con foco en métricas de adherencia terapéutica.',
  },
  {
    id: '4',
    name: 'Ana López',
    type: 'persona',
    country: 'Chile',
    sector: 'Finanzas & Impacto social',
    score: 64,
    bio: 'Consultora en financiación pública y privada para proyectos de impacto.',
  },
  {
    id: '5',
    name: 'Atlas Ventures',
    type: 'organizacion',
    country: 'México',
    sector: 'Venture Building',
    score: 71,
    bio: 'Venture builder que co-crea startups con fundadores técnicos.',
  },
];

function getBadge(score: number) {
  if (score >= 80) {
    return { label: 'Alta confianza', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
  }
  if (score >= 60) {
    return { label: 'Confianza moderada', color: 'bg-amber-500/10 text-amber-300 border-amber-500/40' };
  }
  return { label: 'Riesgo elevado', color: 'bg-red-500/10 text-red-300 border-red-500/40' };
}

export default function FeedPage() {
  const [filter, setFilter] = useState<'todos' | ProfileType>('todos');
  const [selected, setSelected] = useState<FeedItem | null>(null);

  const filteredItems =
    filter === 'todos'
      ? MOCK_FEED
      : MOCK_FEED.filter(item => item.type === filter);

  const active = selected ?? filteredItems[0] ?? null;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Explorador de reputación
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Feed Ethiqia
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Descubre perfiles de personas y organizaciones con su Ethiqia Score.
            Los datos que ves son de demostración: sirven para enseñar cómo
            funcionará la plataforma a inversores y convocatorias.
          </p>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 text-xs">
          <button
            onClick={() => setFilter('todos')}
            className={`rounded-full border px-3 py-1.5 ${
              filter === 'todos'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('persona')}
            className={`rounded-full border px-3 py-1.5 ${
              filter === 'persona'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            Personas
          </button>
          <button
            onClick={() => setFilter('organizacion')}
            className={`rounded-full border px-3 py-1.5 ${
              filter === 'organizacion'
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            Organizaciones
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Lista */}
          <div className="space-y-3">
            {filteredItems.map(item => {
              const badge = getBadge(item.score);
              const isActive = active?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-emerald-400/80 bg-neutral-900'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <span className="rounded-full bg-neutral-800 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-neutral-300">
                          {item.type === 'persona' ? 'Persona' : 'Organización'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {item.country} · {item.sector}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{item.score}</p>
                      <p className="text-[11px] text-neutral-400">Ethiqia Score</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle seleccionado */}
          {active && (
            <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-6 py-6 space-y-5">
              <header className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{active.name}</h2>
                  <p className="text-xs text-neutral-400">
                    {active.type === 'persona' ? 'Perfil personal' : 'Organización'} ·{' '}
                    {active.country} · {active.sector}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold leading-none">{active.score}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Ethiqia Score</p>
                </div>
              </header>

              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${active.score}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {(() => {
                  const badge = getBadge(active.score);
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-neutral-300">
                  Análisis IA simulado para demo
                </span>
              </div>

              <p className="text-sm text-neutral-300">{active.bio}</p>

              <p className="text-[11px] text-neutral-500">
                Esta pantalla es una demo funcional para mostrar el concepto de Ethiqia:
                puntuación de reputación, clasificación rápida y análisis asistido por IA.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
