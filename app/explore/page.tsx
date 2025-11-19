'use client';

import { useEffect, useState } from 'react';

type ExploreItem = {
  id: string;
  name: string;
  country: string;
  sector: string;
  score: number;
  image: string;
  aiProbability: number;
  type: 'persona' | 'organizacion';
};

type StoredDemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

function getBadge(prob: number) {
  if (prob <= 20) {
    return {
      label: 'Real',
      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    };
  }
  if (prob <= 60) {
    return {
      label: 'Mixta / dudosa',
      color: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    };
  }
  return {
    label: 'Alta prob. IA',
    color: 'bg-red-500/10 text-red-300 border-red-500/40',
  };
}

const BASE_ITEMS: ExploreItem[] = [
  {
    id: '1',
    name: 'Studio Nébula',
    country: 'España',
    sector: 'Innovación & I+D',
    score: 86,
    image: '/demo/profile-stock.jpg',
    aiProbability: 18,
    type: 'organizacion',
  },
  {
    id: '2',
    name: 'Lumis Health Lab',
    country: 'Portugal',
    sector: 'Healthtech',
    score: 92,
    image: '/demo/profile-stock.jpg',
    aiProbability: 9,
    type: 'organizacion',
  },
  {
    id: '3',
    name: 'Ana López',
    country: 'Chile',
    sector: 'Impacto social',
    score: 64,
    image: '/demo/profile-stock.jpg',
    aiProbability: 37,
    type: 'persona',
  },
  {
    id: '4',
    name: 'Equipo Ethiqia',
    country: 'Demo',
    sector: 'Reputación · IA',
    score: 78,
    image: '/demo/profile-stock.jpg',
    aiProbability: 28,
    type: 'organizacion',
  },
];

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [selected, setSelected] = useState<ExploreItem | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Empezamos con los perfiles base
    let result = [...BASE_ITEMS];

    // Intentar añadir la publicación demo del usuario (si existe)
    const raw = localStorage.getItem('ethiqia_demo_post');
    if (raw) {
      try {
        const data: StoredDemoPost = JSON.parse(raw);
        if (data.imageUrl) {
          // Inventamos una probabilidad IA a partir del score, solo para la demo
          const aiProbability = Math.round(
            Math.min(95, Math.max(5, (100 - (data.score ?? 70)) * 0.6 + 10)),
          );

          const demoItem: ExploreItem = {
            id: 'demo',
            name: data.name || 'Tu publicación demo',
            country: 'Demo',
            sector: 'Tu espacio en Ethiqia',
            score: data.score ?? 80,
            image: data.imageUrl,
            aiProbability,
            type: 'persona',
          };

          // La ponemos la primera
          result = [demoItem, ...result];
        }
      } catch {
        // ignoramos errores
      }
    }

    setItems(result);
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Explorar
          </p>
          <h1 className="text-2xl font-semibold">
            Descubre perfiles en Ethiqia
          </h1>
          <p className="text-xs text-neutral-400">
            Vista demo del explorador de Ethiqia. Cada tarjeta combina foto,
            Ethiqia Score y una etiqueta de probabilidad IA/real para enseñar
            cómo se podría descubrir talento, empresas y proyectos con buena
            reputación.
          </p>
        </header>

        {/* Rejilla tipo Instagram */}
        <div className="grid grid-cols-2 gap-[3px] bg-neutral-900 rounded-2xl overflow-hidden">
          {items.map((item) => {
            const badge = getBadge(item.aiProbability);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="relative aspect-square overflow-hidden bg-neutral-900 group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-150"
                />

                {/* Degradado inferior */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {/* Texto abajo */}
                <div className="absolute inset-x-2 bottom-2 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{item.name}</p>
                    <span className="rounded-full bg-black/60 px-2 py-[2px] text-[10px] text-neutral-200">
                      {item.score} · Score
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 truncate">
                    {item.country} · {item.sector}
                  </p>
                </div>

                {/* Badge IA abajo a la derecha */}
                <div className="absolute right-1.5 top-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-[2px] text-[9px] ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </button>
            );
          })}

          {items.length === 0 && (
            <div className="col-span-2 flex items-center justify-center py-12">
              <p className="text-sm text-neutral-500">
                Aún no hay elementos para explorar.
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-500">
          *Todos los perfiles e imágenes, salvo tu publicación demo si existe,
          están simulados en esta versión alfa. Sirven para explicar el concepto
          de Ethiqia a inversores y partners.
        </p>
      </section>

      {/* Modal de detalle */}
      {selected && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div>
                <p className="text-sm font-medium text-neutral-100">
                  {selected.name}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {selected.type === 'persona' ? 'Persona' : 'Organización'} ·{' '}
                  {selected.country}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {selected.sector}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="w-full bg-neutral-900">
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full object-cover max-h-[320px]"
              />
            </div>

            <div className="px-4 py-3 space-y-2 text-sm">
              <p className="text-neutral-300">
                <span className="font-semibold">Ethiqia Score:</span>{' '}
                {selected.score}/100
              </p>
              <p className="text-[12px] text-neutral-400">
                Nivel de confianza estimado para este perfil o publicación
                dentro de la demo.
              </p>

              <p className="text-neutral-300 text-xs">
                <span className="font-semibold">Probabilidad imagen IA:</span>{' '}
                {selected.aiProbability}% (
                {getBadge(selected.aiProbability).label})
              </p>
              <p className="text-[11px] text-neutral-500">
                Esta probabilidad es simulada en la demo, pensada para ilustrar
                cómo Ethiqia podría marcar contenido generado por IA frente a
                contenido real.
              </p>
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full rounded-md border border-neutral-700 py-2 text-sm text-neutral-100 hover:border-emerald-400 hover:text-emerald-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
