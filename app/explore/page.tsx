'use client';

type ExploreItem = {
  id: string;
  name: string;
  country: string;
  sector: string;
  score: number;
  image: string;
};

const ITEMS: ExploreItem[] = [
  {
    id: '1',
    name: 'Studio Nébula',
    country: 'España',
    sector: 'Innovación & I+D',
    score: 86,
    image: '/demo/profile-stock.jpg',
  },
  {
    id: '2',
    name: 'Lumis Health Lab',
    country: 'Portugal',
    sector: 'Healthtech',
    score: 92,
    image: '/demo/profile-stock.jpg',
  },
  {
    id: '3',
    name: 'Ana López',
    country: 'Chile',
    sector: 'Impacto social',
    score: 64,
    image: '/demo/profile-stock.jpg',
  },
  {
    id: '4',
    name: 'Equipo Ethiqia',
    country: 'Demo',
    sector: 'Reputación · IA',
    score: 78,
    image: '/demo/profile-stock.jpg',
  },
];

export default function ExplorePage() {
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
            Vista demo del explorador de Ethiqia. Cada tarjeta combina foto, Ethiqia Score
            y contexto del perfil. Ideal para enseñar cómo se podría descubrir talento,
            empresas y proyectos con buena reputación.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 pb-10">
          {ITEMS.map((item) => (
            <article
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-2 bottom-2 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{item.name}</p>
                  <span className="rounded-full bg-black/60 px-2 py-[2px] text-[10px] text-neutral-200">
                    {item.score} · Score
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  {item.country} · {item.sector}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
