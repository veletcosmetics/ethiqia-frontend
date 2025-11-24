'use client';

import { useEffect, useState } from 'react';

type ExploreItem = {
  id: string;
  name: string;
  country: string;
  sector: string;
  score: number;
  aiProbability: number;
  image: string;
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

// Perfiles demo fijos para enseñar el concepto
const BASE_ITEMS: ExploreItem[] = [
  {
    id: '1',
    name: 'Studio Nébula',
    country: 'España',
    sector: 'Innovación & I+D',
    score: 86,
    aiProbability: 18,
    image: '/demo/profile-stock.jpg',
    type: 'organizacion',
  },
  {
    id: '2',
    name: 'Lumis Health Lab',
    country: 'Portugal',
    sector: 'Healthtech',
    score: 92,
    aiProbability: 9,
    image: '/demo/profile-stock.jpg',
    type: 'organizacion',
  },
  {
    id: '3',
    name: 'Ana López',
    country: 'Chile',
    sector: 'Impacto social',
    score: 64,
    aiProbability: 37,
    image: '/demo/profile-stock.jpg',
    type: 'persona',
  },
  {
    id: '4',
    name: 'GreenWave Impact',
    country: 'México',
    sector: 'Clima & sostenibilidad',
    score: 74,
    aiProbability: 28,
    image: '/demo/profile-stock.jpg',
    type: 'organizacion',
  },
  {
    id: '5',
    name: 'Nova Legal Tech',
    country: 'España',
    sector: 'Legaltech',
    score: 81,
    aiProbability: 22,
    image: '/demo/profile-stock.jpg',
    type: 'organizacion',
  },
  {
    id: '6',
    name: 'María Silva',
    country: 'Brasil',
    sector: 'Creadora de contenido',
    score: 59,
    aiProbability: 63,
    image: '/demo/profile-stock.jpg',
    type: 'persona',
  },
];

const DEMO_STORAGE_KEY = 'ethiqia_demo_post';

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [selected, setSelected] = useState<ExploreItem | null>(null);

  // Cargar publicaciones demo del usuario (localStorage) + mezclar con perfiles fijos
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let result = [...BASE_ITEMS];

    // Intentar añadir la publicación demo del usuario (si existe)
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        const data: StoredDemoPost = JSON.parse(raw);
        if (data.imageUrl) {
          const demoItem: ExploreItem = {
            id: 'demo',
            name: data.name || 'Tu publicación demo',
            country: 'Demo',
            sector: 'Perfil Ethiqia',
            score: data.score,
            aiProbability: Math.round(
              Math.min(
                95,
                Math.max(5, (100 - data.score) * 0.6 + 10)
              )
            ),
            image: data.imageUrl,
            type: 'persona',
          };

          // Tu publicación primero en la rejilla
          result = [demoItem, ...result];
        }
      } catch {
        // ignorar errores
      }
    }

    setItems(result);
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            Explorar
          </p>
          <h1 className="text-2xl font-semibold">
            Descubre perfiles y publicaciones en Ethiqia
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Rejilla tipo Instagram con perfiles simulados y tu publicación demo
            (si existe). Cada tarjeta muestra un Ethiqia Score y una etiqueta
            con la probabilidad de que la imagen sea IA.
          </p>
        </header>

        {/* Rejilla tipo Instagram */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-[2px] bg-neutral-900 rounded-2xl overflow-hidden">
          {items.map((item) => {
            const badge = getBadge(item.aiProbability);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="relative group w-full aspect-square overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-150"
                />

                {/* Overlay hover */}
                <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-150" />

                {/* Score arriba izquierda */}
                <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 text-[10px]">
                  <span className="inline-flex items-center rounded-full bg-black/70 px-2 py-[2px] text-neutral-100">
                    ⭐ {item.score}
                  </span>
                </div>

                {/* Badge IA abajo derecha */}
                <div className="absolute right-1.5 bottom-1.5">
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
            <div className="col-span-3 md:col-span-4 flex items-center justify-center py-12">
              <p className="text-sm text-neutral-500">
                Aún no hay elementos para explorar.
              </p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-500">
          *Todos los perfiles, salvo tu publicación demo, están simulados para
          esta versión alfa. Sirven para explicar el concepto de Ethiqia a
          inversores y partners.
        </p>
      </section>

      {/* Modal detalle */}
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
                  {selected.country} · {selected.sector}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full max-h-[320px] object-cover"
              />
            </div>

            <div className="px-4 py-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-neutral-300">
                    <span className="font-semibold">Ethiqia Score:</span>{' '}
                    {selected.score}/100
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Nivel de confianza reputacional estimado para este perfil o
                    publicación.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-neutral-300">
                    <span className="font-semibold">
                      Probabilidad de imagen IA:
                    </span>{' '}
                    {selected.aiProbability}%
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Estimación simulada para la demo, pensada para mostrar cómo
                    Ethiqia puede señalar contenido generado por IA sin
                    penalizar su uso.
                  </p>
                </div>
              </div>
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
