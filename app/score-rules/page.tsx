import Link from "next/link";

export const runtime = "nodejs";

export default function ScoreRulesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Reglas del Ethiqia Score</h1>
            <p className="text-sm text-neutral-400 mt-1">
              El Score mide <span className="text-neutral-200 font-semibold">confianza</span> y{" "}
              <span className="text-neutral-200 font-semibold">consistencia</span>. No es un juego de
              “publica más = más puntos”.
            </p>
          </div>

          <Link
            href="/feed"
            className="shrink-0 text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver al feed
          </Link>
        </div>

        <div className="space-y-4">
          {/* Resumen */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Resumen rápido</h2>

            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>
                Todo el mundo empieza con <span className="font-semibold text-white">50</span>.
              </li>
              <li>
                La actividad en la red social suma por{" "}
                <span className="font-semibold text-white">hitos</span> (no por cada click, like o post).
              </li>
              <li>
                El objetivo es <span className="font-semibold text-white">estabilidad</span>. Se evita
                el “sube y baja” constante.
              </li>
              <li>
                La mala conducta puede aplicar un{" "}
                <span className="font-semibold text-white">strike</span> con{" "}
                <span className="font-semibold text-white">-10</span> puntos de forma inmediata.
              </li>
              <li>
                El tramo alto del Score se completa en el futuro con{" "}
                <span className="font-semibold text-white">APIs</span> (vida real: compras verificadas,
                hábitos, participación ciudadana, logros, etc.).
              </li>
            </ul>
          </div>

          {/* Bloque Base */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 0 — Base</h2>
            <p className="mt-2 text-sm text-neutral-200">
              Al crear la cuenta recibes <span className="font-semibold text-white">+50</span>.
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Esto evita que la gente empiece en “cero reputación” y reduce el incentivo a hacer spam para
              “arrancar”.
            </p>
          </div>

          {/* Transparencia */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 1 — Transparencia</h2>

            <p className="mt-2 text-sm text-neutral-200">
              Cuando completas el mínimo de perfil se otorgan{" "}
              <span className="font-semibold text-white">+2</span> puntos. Es un{" "}
              <span className="font-semibold text-white">hito único</span>.
            </p>

            <div className="mt-3 rounded-xl border border-neutral-800 bg-black p-4">
              <div className="text-xs font-semibold text-neutral-200">¿Qué cuenta como “perfil mínimo”?</div>
              <ul className="mt-2 space-y-1 text-xs text-neutral-300 list-disc list-inside">
                <li>Foto de perfil</li>
                <li>Nombre o alias + @username</li>
                <li>País / ubicación</li>
                <li>Bio mínima</li>
                <li>Al menos un canal de contacto (por ejemplo web o red social)</li>
              </ul>
              <div className="mt-2 text-[11px] text-neutral-500">
                En el MVP esto es deliberadamente sencillo. Lo importante es incentivar identidad y
                contexto, no recopilar datos sensibles.
              </div>
            </div>
          </div>

          {/* Conducta */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 2 — Buena conducta</h2>

            <p className="mt-2 text-sm text-neutral-200">
              Se premia la consistencia sin incidentes. No se premia “ser activo”, se premia{" "}
              <span className="font-semibold text-white">no generar daño</span>.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>
                <span className="font-semibold text-white">+2</span> por cada tramo limpio de{" "}
                <span className="font-semibold text-white">90 días</span> desde el último strike.
              </li>
              <li>
                Máximo de conducta: <span className="font-semibold text-white">+8 por año</span> (4 tramos).
              </li>
              <li>
                Cada strike aplica <span className="font-semibold text-white">-10 inmediato</span>.
              </li>
            </ul>

            <div className="mt-3 text-xs text-neutral-400">
              Importante: un strike “reinicia” el tramo limpio. La reputación se consolida demostrando
              estabilidad, no acumulando acciones.
            </div>
          </div>

          {/* Participación */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Bloque 3 — Participación (por hitos, no por acción)</h2>

            <p className="mt-2 text-sm text-neutral-200">
              La participación cuenta, pero sin incentivar spam. Se mide por{" "}
              <span className="font-semibold text-white">meses activos</span>: por ejemplo, haber publicado
              al menos una vez durante un mes.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc list-inside">
              <li>Hitos de meses activos: 2 / 4 / 6 / 8 / 10 / 12</li>
              <li>
                <span className="font-semibold text-white">+1</span> por hito alcanzado
                (máximo <span className="font-semibold text-white">+6 por año</span>).
              </li>
            </ul>

            <div className="mt-3 text-xs text-neutral-400">
              Esto crea “ritmo” sin premiar hiperactividad. Publicar 50 veces en un mes no da más puntos
              que publicar 1 vez en ese mes.
            </div>
          </div>

          {/* Penalizaciones */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Penalizaciones y strikes</h2>

            <p className="mt-2 text-sm text-neutral-200">
              Conducta tóxica o abusos (insultos, acoso, spam, lenguaje ofensivo reiterado, etc.) pueden
              disparar strikes y restar puntos.
            </p>

            <div className="mt-3 rounded-xl border border-neutral-800 bg-black p-4">
              <div className="text-xs font-semibold text-neutral-200">Ejemplos de señales (MVP)</div>
              <ul className="mt-2 space-y-1 text-xs text-neutral-300 list-disc list-inside">
                <li>Lenguaje ofensivo repetido</li>
                <li>Mensajes masivos / acoso por repetición</li>
                <li>Spam de publicaciones o comentarios</li>
                <li>Reportes reiterados por otros usuarios</li>
              </ul>
              <div className="mt-2 text-[11px] text-neutral-500">
                En Beta puede ser simple y controlado. El sistema existe y se endurece cuando haya
                tracción real.
              </div>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Ejemplos (para entenderlo en 10 segundos)</h2>

            <div className="mt-3 space-y-3 text-sm text-neutral-200">
              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs font-semibold text-neutral-200">Caso 1: usuario correcto y transparente</div>
                <div className="mt-2 text-xs text-neutral-300">
                  Base 50 + Perfil mínimo 2 + Conducta (1 año limpio) 8 + Participación (2 meses activos) 1
                  = <span className="font-semibold text-white">61</span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs font-semibold text-neutral-200">Caso 2: usuario con un strike</div>
                <div className="mt-2 text-xs text-neutral-300">
                  Base 50 + Perfil mínimo 2 + Strike (-10) + Conducta (tras 90 días limpios) 2
                  = <span className="font-semibold text-white">44</span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs font-semibold text-neutral-200">Caso 3: hiperactivo pero sin spam-reward</div>
                <div className="mt-2 text-xs text-neutral-300">
                  Publicar 100 veces en 1 mes no sube puntos por acción. Solo cuenta como “mes activo”.
                  El sistema premia estabilidad anual, no volumen.
                </div>
              </div>
            </div>
          </div>

          {/* Futuro */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold">Futuro: el tramo alto del Score</h2>

            <p className="mt-2 text-sm text-neutral-200">
              El tramo alto (por ejemplo de 75 hacia 98+) se completa con integraciones y señales de vida
              real: compras verificadas, hábitos saludables, participación ciudadana, logros profesionales,
              etc. Esto permite que el Score sea útil sin depender de “ser influencer” ni de estar
              constantemente publicando.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
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
              <Link
                href="/notifications"
                className="rounded-full border border-neutral-700 bg-black px-5 py-2 text-xs font-semibold text-white hover:border-neutral-500"
              >
                Ver notificaciones
              </Link>
            </div>
          </div>

          {/* Nota final */}
          <div className="text-xs text-neutral-500 pt-2">
            Nota: estas reglas pueden evolucionar. Ethiqia prioriza reputación realista, no gamificación.
          </div>
        </div>
      </section>
    </main>
  );
}
