// app/score-rules/page.tsx
import Link from "next/link";

export const runtime = "nodejs";

export default function ScoreRulesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/profile"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver a tu perfil
          </Link>

          <Link
            href="/score"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            Ver score (detalle)
          </Link>
        </div>

        <h1 className="text-3xl font-semibold">Cómo funciona tu Ethiqia Score</h1>
        <p className="text-neutral-400 mt-2">
          El score no está diseñado para subir por “actividad superficial”. Está diseñado para consolidar
          confianza: transparencia, buena conducta y consistencia.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-semibold">Base</div>
            <div className="mt-2 text-sm text-neutral-300">
              Todo el mundo empieza con <span className="text-white font-semibold">50</span>.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-semibold">Bloque 1: Transparencia</div>
            <div className="mt-2 text-sm text-neutral-300">
              Completar el perfil mínimo otorga <span className="text-emerald-400 font-semibold">+2</span>{" "}
              (solo una vez).
            </div>
            <ul className="mt-3 text-sm text-neutral-400 list-disc pl-5 space-y-1">
              <li>Nombre</li>
              <li>@username</li>
              <li>Avatar</li>
              <li>Bio</li>
              <li>Ubicación o país (mínimo)</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-semibold">Bloque 2: Buena conducta</div>
            <div className="mt-2 text-sm text-neutral-300">
              La buena conducta se consolida con el tiempo:{" "}
              <span className="text-emerald-400 font-semibold">hasta +8 al año</span>, por trimestres limpios.
            </div>
            <ul className="mt-3 text-sm text-neutral-400 list-disc pl-5 space-y-1">
              <li>Cada 90 días sin strikes: <span className="text-white font-semibold">+2</span></li>
              <li>Máximo 4 hitos/año: <span className="text-white font-semibold">+8</span></li>
              <li>
                Si hay mala conducta (strike): <span className="text-red-400 font-semibold">-10 inmediato</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-semibold">Bloque 3: Participación (consistencia, no spam)</div>
            <div className="mt-2 text-sm text-neutral-300">
              No se puntúa “por post”. Se puntúa por constancia anual:{" "}
              <span className="text-emerald-400 font-semibold">hasta +6</span>.
            </div>
            <ul className="mt-3 text-sm text-neutral-400 list-disc pl-5 space-y-1">
              <li>Mes activo = al menos 1 publicación ese mes</li>
              <li>Hitos: 2/4/6/8/10/12 meses activos</li>
              <li>Cada hito suma <span className="text-white font-semibold">+1</span> (máximo <span className="text-white font-semibold">+6</span>)</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm font-semibold">Límites y filosofía</div>
            <div className="mt-2 text-sm text-neutral-300">
              El objetivo es que el score sea estable y creíble. No debe subir/bajar por microacciones.
            </div>
            <ul className="mt-3 text-sm text-neutral-400 list-disc pl-5 space-y-1">
              <li>Fundación el primer año</li>
              <li>Los años siguientes demuestras consistencia, no crecimiento infinito</li>
              <li>El 100 debe ser casi inalcanzable (se reserva para señales externas: APIs, verificaciones, etc.)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-700/40 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-emerald-300">Consejo práctico</div>
          <div className="mt-2 text-sm text-neutral-200">
            Completa el perfil mínimo y mantén conducta limpia. La participación se mide por constancia,
            no por publicar a lo loco.
          </div>
        </div>
      </section>
    </main>
  );
}
