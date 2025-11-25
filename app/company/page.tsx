'use client';

import React from 'react';

type CompanyProfile = {
  name: string;
  country: string;
  sector: string;
  logoLetter: string;
  isVerified: boolean;
  ethScore: number;
  reviewTrust: number;
  activityLevel: number;
  impactScore: number;
};

const COMPANY_DEMO: CompanyProfile = {
  name: 'Studio Nébula · Demo Empresa',
  country: 'España',
  sector: 'Cosmética profesional · I+D',
  logoLetter: 'N',
  isVerified: true,
  ethScore: 86,
  reviewTrust: 91,
  activityLevel: 78,
  impactScore: 73,
};

function getBarColor(value: number) {
  if (value < 40) return 'bg-red-500';
  if (value < 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function CompanyProfilePage() {
  const c = COMPANY_DEMO;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Cabecera profesional */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/80 to-sky-500/80 flex items-center justify-center text-2xl font-semibold shadow-lg shadow-emerald-500/30">
              <span>{c.logoLetter}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{c.name}</h1>
                {c.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300">
                    ✓ Cuenta profesional verificada (demo)
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400">
                {c.sector} · {c.country}
              </p>
              <p className="text-xs text-neutral-500 max-w-xl">
                Vista profesional de cómo Ethiqia presentaría la reputación de
                una empresa real: puntuaciones, evidencias y actividad verificadas.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Perfil profesional demo
            </p>
            <p className="text-sm text-neutral-400 max-w-xs md:text-right">
              Ideal para enseñar a inversores, administraciones públicas y
              empresas cómo podrían ver la reputación de un negocio en Ethiqia.
            </p>
          </div>
        </header>

        {/* Métricas principales */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <p className="text-[11px] text-neutral-400 uppercase tracking-[0.16em]">
              Ethiqia Score
            </p>
            <p className="text-3xl font-semibold text-emerald-400">
              {c.ethScore}
              <span className="text-base text-neutral-500">/100</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              Índice resumen de reputación digital según actividad, coherencia y
              evidencias verificadas.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <p className="text-[11px] text-neutral-400 uppercase tracking-[0.16em]">
              Confianza en reseñas
            </p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold text-neutral-100">
                {c.reviewTrust}
                <span className="text-sm text-neutral-500">/100</span>
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(
                  c.reviewTrust
                )}`}
                style={{ width: `${c.reviewTrust}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Cuánto podemos fiarnos de las opiniones asociadas a esta empresa
              (antispam, bots, IA, cuentas falsas).
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <p className="text-[11px] text-neutral-400 uppercase tracking-[0.16em]">
              Actividad & trayectoria
            </p>
            <p className="text-2xl font-semibold text-neutral-100">
              {c.activityLevel}
              <span className="text-sm text-neutral-500">/100</span>
            </p>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(
                  c.activityLevel
                )}`}
                style={{ width: `${c.activityLevel}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Frecuencia, consistencia y coherencia de la actividad digital en
              el tiempo.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <p className="text-[11px] text-neutral-400 uppercase tracking-[0.16em]">
              Impacto & sostenibilidad
            </p>
            <p className="text-2xl font-semibold text-neutral-100">
              {c.impactScore}
              <span className="text-sm text-neutral-500">/100</span>
            </p>
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${getBarColor(
                  c.impactScore
                )}`}
                style={{ width: `${c.impactScore}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Peso de acciones alineadas con impacto social positivo y
              sostenibilidad (demo).
            </p>
          </div>
        </section>

        {/* Qué mide Ethiqia para empresas */}
        <section className="grid gap-6 md:grid-cols-2 items-start">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              ¿Qué evalúa Ethiqia de una empresa?
            </h2>
            <p className="text-sm text-neutral-400">
              Este bloque explica, de forma visual y sencilla, qué dimensiones
              tendría en cuenta Ethiqia a la hora de puntuar un negocio real.
            </p>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex gap-2">
                <span className="mt-[3px] text-emerald-400">●</span>
                <div>
                  <p className="font-medium">Transparencia y coherencia</p>
                  <p className="text-xs text-neutral-500">
                    Alineación entre lo que la empresa comunica y lo que
                    realmente hace: webs, redes, reseñas, documentos públicos.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] text-emerald-400">●</span>
                <div>
                  <p className="font-medium">Tratamiento de clientes</p>
                  <p className="text-xs text-neutral-500">
                    Revisión de quejas, tiempos de respuesta, tono, y cómo se
                    resuelven conflictos públicos.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] text-emerald-400">●</span>
                <div>
                  <p className="font-medium">
                    Impacto social y medioambiental (demo)
                  </p>
                  <p className="text-xs text-neutral-500">
                    Participación en proyectos sociales, uso de claims
                    sostenibles coherentes y alineamiento con estándares
                    ESG/impacto.
                  </p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] text-emerald-400">●</span>
                <div>
                  <p className="font-medium">Uso responsable de la IA</p>
                  <p className="text-xs text-neutral-500">
                    Cómo comunica la empresa contenido generado por IA (mockups,
                    campañas, influencers virtuales) y si lo hace con
                    transparencia.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Actividad reciente verificada */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              Actividad reciente verificada (demo)
            </h2>
            <p className="text-xs text-neutral-500">
              Ejemplos ficticios para enseñar cómo Ethiqia podría registrar
              hitos de la empresa.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-xs">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-neutral-100">
                    Colaboración validada con Universidad / Parque Científico
                  </p>
                  <p className="text-xs text-neutral-400">
                    Proyecto de I+D en marcha, entidad verificadora externa y
                    participación en consorcio público-privado.
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-400">
                    +2.4 puntos en Ethiqia Score · +3.1 puntos en impacto
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 h-8 w-8 rounded-full bg-sky-500/15 flex items-center justify-center text-xs">
                  ⓘ
                </div>
                <div>
                  <p className="font-medium text-neutral-100">
                    Campaña en redes etiquetada como “Contenido con IA”
                  </p>
                  <p className="text-xs text-neutral-400">
                    Uso de imágenes generadas por IA para mockups, correctamente
                    etiquetadas y sin claims engañosos.
                  </p>
                  <p className="mt-1 text-[11px] text-sky-400">
                    +1.2 puntos en transparencia · sin penalización por uso de IA
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center text-xs">
                  !
                </div>
                <div>
                  <p className="font-medium text-neutral-100">
                    Gestión de reseña negativa de forma constructiva
                  </p>
                  <p className="text-xs text-neutral-400">
                    Queja pública respondida de forma respetuosa, con solución
                    visible y seguimiento.
                  </p>
                  <p className="mt-1 text-[11px] text-amber-300">
                    +1.8 puntos en confianza · mejora percepción en clientes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integraciones y APIs */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">
            Integraciones y APIs (visión futura)
          </h2>
          <p className="text-sm text-neutral-400 max-w-3xl">
            En una versión avanzada, Ethiqia podría conectarse con APIs externas
            (pasarelas de pago, plataformas de reseñas, CRMs, contadores de
            afluencia, etc.) para validar hábitos reales: recurrencia de
            clientes, quejas resueltas, compras responsables o incluso hábitos
            saludables en apps de usuarios.
          </p>

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="font-semibold text-neutral-100">
                APIs de plataformas de reseñas
              </p>
              <p className="text-[11px] text-neutral-500">
                Validación cruzada de reseñas (fecha, usuario, ticket real) para
                evitar reseñas falsas o compradas.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="font-semibold text-neutral-100">
                Pasarelas de pago / TPV (demo)
              </p>
              <p className="text-[11px] text-neutral-500">
                Volumen y recurrencia anónima de clientes, estacionalidad y
                estabilidad del negocio.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="font-semibold text-neutral-100">
                Sensores / apps de afluencia
              </p>
              <p className="text-[11px] text-neutral-500">
                Conteo de visitas, tiempo de estancia, participación en eventos
                o actividades saludables (ejemplo: 10.000 pasos, clases, etc.).
              </p>
            </div>
          </div>
        </section>

        {/* Bloque final para inversores */}
        <section className="rounded-2xl border border-emerald-600/40 bg-emerald-950/20 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-emerald-300">
            Cómo vería esto un inversor o una administración pública
          </h2>
          <p className="text-sm text-neutral-200">
            Ethiqia no es solo una red social: es una capa de reputación
            digital que resume, de forma visual y auditada, la trayectoria de
            una empresa. Un banco, un marketplace o una convocatoria pública
            podrían usar este perfil profesional para:
          </p>
          <ul className="list-disc pl-5 text-sm text-neutral-200 space-y-1">
            <li>
              Reducir riesgo reputacional al colaborar con una empresa.
            </li>
            <li>
              Priorizar proyectos con impacto social y buenas prácticas
              demostrables.
            </li>
            <li>
              Detectar comportamientos extremos (hate, abuso de IA, spam).
            </li>
            <li>
              Premiar a empresas con buena trayectoria con mejores condiciones o
              visibilidad.
            </li>
          </ul>
          <p className="text-[11px] text-neutral-500 mt-1">
            Todo lo que ves aquí es demo. La fuerza de Ethiqia está en cómo
            estas métricas podrían alimentarse de datos reales y verificables
            vía APIs e integraciones.
          </p>
        </section>
      </section>
    </main>
  );
}
