import Link from "next/link";

export const runtime = "nodejs";

export default function ScoreRulesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Reglas del Ethiqia Score</h1>
            <p className="text-sm text-neutral-400 mt-1">
              El Score mide confianza y consistencia. No es un juego de “publica más = más puntos”.
            </p>
          </div>

          <Link
            href="/"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Resumen</h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>
                Todos empiezan con <span className="font-semibold text-white">50</span>.
              </li>
              <li>
                La red social aporta puntos solo por <span className="font-semibold">hitos</span>, no por cada acción.
              </li>
              <li>
                Los puntos se <span className="font-semibold">consolidan</span>: el objetivo es estabilidad, no subir y bajar constantemente.
              </li>
              <li>
                La mala conducta puede restar <span className="font-semibold text-white">-10</span> de forma inmediata.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 0 — Base</h2>
            <p className="mt-2 text-sm text-neutral-200">
              <span className="font-semibold text-white">+50</span> al crear cuenta.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 1 — Transparencia</h2>
            <p className="mt-2 text-sm text-neutral-200">
              <span className="font-semibold text-white">+2</span> cuando completas el mínimo de perfil (hito único).
            </p>

            <div className="mt-3 text-xs text-neutral-400">
              Ejemplo de mínimo: foto + nombre/alias + país/ubicación + bio mínima + un canal de contacto.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 2 — Buena conducta</h2>
            <p className="mt-2 text-sm text-neutral-200">
              Se premia la consistencia sin incidentes.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>
                <span className="font-semibold text-white">+2</span> por cada “tramo limpio” de 90 días desde el último strike (máximo{" "}
                <span className="font-semibold text-white">+8/año</span>).
              </li>
              <li>
                Cada strike aplica <span className="font-semibold text-white">-10 inmediato</span>.
              </li>
            </ul>

            <div className="mt-3 text-xs text-neutral-400">
              El enfoque es “consolidar reputación”. Un año limpio te deja el bloque de conducta prácticamente hecho.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 3 — Participación (por hitos, no por acción)</h2>
            <p className="mt-2 text-sm text-neutral-200">
              La participación cuenta, pero sin incentivar spam. Se mide por meses activos (por ejemplo, haber publicado al menos una vez
              en un mes).
            </p>

            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>Hitos de meses activos: 2 / 4 / 6 / 8 / 10 / 12</li>
              <li>
                <span className="font-semibold text-white">+1</span> por hito alcanzado (máximo{" "}
                <span className="font-semibold text-white">+6/año</span>).
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Penalizaciones</h2>
            <p className="mt-2 text-sm text-neutral-200">
              Conducta tóxica o abusos (insultos, acoso, spam, lenguaje ofensivo reiterado, etc.) pueden disparar strikes y restar puntos.
            </p>
            <div className="mt-3 text-xs text-neutral-400">
              Nota: en el MVP las señales pueden ser simples y controladas. Lo importante es que el mecanismo exista.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Futuro</h2>
            <p className="mt-2 text-sm text-neutral-200">
              Lo potente viene después: APIs (compras verificadas, vida saludable, participación ciudadana, logros profesionales, etc.)
              para completar el tramo alto del score (sin depender de la actividad social).
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/feed"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black"
              >
                Ir al feed
              </Link>
              <Link
                href="/profile"
                className="rounded-full border border-neutral-700 bg-black px-5 py-2 text-xs font-semibold text-white hover:border-neutral-500"
              >
                Ver mi perfil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
