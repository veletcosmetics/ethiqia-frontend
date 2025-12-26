'use client';

import Link from 'next/link';

export default function ScoreRulesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Reglas del Ethiqia Score (Usuario)</h1>
            <p className="text-xs text-neutral-400">
              Score por transparencia, conducta y consistencia. No por “hacer ruido” en la red.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/score"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Ver mi Score
            </Link>
            <Link
              href="/feed"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Volver al feed
            </Link>
          </div>
        </div>

        {/* Principios */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-sm font-semibold">Principios</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-200">
            <li>
              <span className="font-semibold">Base por defecto:</span> todo el mundo empieza con <span className="font-semibold">50</span>.
            </li>
            <li>
              <span className="font-semibold">Sin gamificación:</span> no se suman puntos por cada like, comentario o post.
            </li>
            <li>
              <span className="font-semibold">Por hitos y caps:</span> se premia la consistencia con límites anuales (no crecimiento infinito).
            </li>
            <li>
              <span className="font-semibold">Penalización inmediata:</span> la mala conducta resta en el momento, no “al final del año”.
            </li>
            <li>
              <span className="font-semibold">100 casi inalcanzable:</span> está reservado para perfiles excepcionales y verificados por señales fuertes (APIs/vida real).
            </li>
          </ul>
        </div>

        {/* Bloques */}
        <div className="mt-5 grid grid-cols-1 gap-4">
          {/* Bloque base */}
          <Block
            title="Bloque 0 — Base"
            subtitle="Punto de partida para todos"
            rows={[
              { label: 'Score inicial', value: '+50' },
            ]}
            note="Este bloque existe para que nadie arranque desde cero y el sistema sea estable."
          />

          {/* Transparencia */}
          <Block
            title="Bloque 1 — Transparencia"
            subtitle="Premio por completar lo mínimo del perfil"
            rows={[
              { label: 'Perfil mínimo completado', value: '+2 (una sola vez)' },
            ]}
            note={
              'Objetivo: reducir cuentas vacías y mejorar confianza básica. No se premia “editar mil veces”; se premia cumplir mínimos.'
            }
          />

          {/* Conducta */}
          <Block
            title="Bloque 2 — Buena conducta"
            subtitle="Consistencia anual en comportamiento (capado)"
            rows={[
              { label: 'Cada 90 días sin strikes (trimestre limpio)', value: '+2' },
              { label: 'Máximo anual por conducta', value: '+8 (4 trimestres)' },
              { label: 'Strike por mala conducta', value: '−10 inmediato' },
              { label: 'Límite de seguridad (penalización anual)', value: 'cap −30' },
            ]}
            note={
              'Esto consolida reputación: se gana con tiempo. Si hay mala conducta, se pierde rápido.'
            }
          />

          {/* Participación */}
          <Block
            title="Bloque 3 — Participación"
            subtitle="Consistencia, no actividad compulsiva"
            rows={[
              { label: 'Mes activo', value: 'cuenta si has publicado al menos 1 vez ese mes' },
              { label: 'Hitos por meses activos', value: '2, 4, 6, 8, 10, 12 meses' },
              { label: 'Puntos por hito', value: '+1 por cada hito' },
              { label: 'Máximo anual participación', value: '+6' },
            ]}
            note={
              'No se premia “postear 100 veces”. Se premia estar presente de forma estable durante el año.'
            }
          />
        </div>

        {/* Qué NO da puntos */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-sm font-semibold">Qué NO da puntos (intencionadamente)</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-200">
            <li>No hay puntos por likes, follows, comentarios o “interacciones” individuales.</li>
            <li>No hay puntos por “spam de publicaciones”.</li>
            <li>No hay puntos por viralidad.</li>
          </ul>
          <div className="mt-3 text-xs text-neutral-500">
            Motivo: evitar manipulación, granjas de interacción y comportamientos tóxicos orientados a “farmear puntos”.
          </div>
        </div>

        {/* Interpretación */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-sm font-semibold">Interpretación rápida del score</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Range label="&lt; 50" desc="Penalizaciones activas o falta de mínimos." />
            <Range label="50" desc="Base (usuario nuevo o sin hitos)." />
            <Range label="52–60" desc="Fundación (transparencia + conducta inicial)." />
            <Range label="60–75" desc="Fundación sólida (hitos consolidados anuales)." />
            <Range label="75–90" desc="Alta confianza (consistencia fuerte + señales reales)." />
            <Range label="90–98" desc="Muy alta confianza (señales fuertes verificadas)." />
            <Range label="98–100" desc="Élite (caso excepcional)." />
          </div>
        </div>

        {/* Próximamente */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-sm font-semibold">Próximamente (no aplica aún en esta fase)</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-200">
            <li>
              <span className="font-semibold">APIs verificadas:</span> compras responsables, participación ciudadana, hábitos saludables, formación, etc.
            </li>
            <li>
              <span className="font-semibold">Score Empresa:</span> reglas distintas (verificación, cumplimiento, transparencia comercial, garantías, APIs).
            </li>
          </ul>
          <div className="mt-3 text-xs text-neutral-500">
            Importante: Usuario y Empresa no comparten el mismo modelo de conducta; se definen reglas separadas.
          </div>
        </div>

        <div className="mt-8 text-xs text-neutral-500">
          Este documento describe el modelo “Usuario”. Para empresas habrá una página independiente con reglas específicas.
        </div>
      </section>
    </main>
  );
}

function Block({
  title,
  subtitle,
  rows,
  note,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-neutral-200">{r.label}</span>
            <span className="font-semibold text-neutral-100">{r.value}</span>
          </div>
        ))}
      </div>

      {note ? <div className="mt-4 text-xs text-neutral-500">{note}</div> : null}
    </div>
  );
}

function Range({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-4">
      <div className="text-xs text-neutral-400">Rango</div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs text-neutral-300">{desc}</div>
    </div>
  );
}
