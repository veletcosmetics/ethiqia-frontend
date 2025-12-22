"use client";

import React from "react";
import Link from "next/link";

export default function ScoreRulesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/profile"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver al perfil
          </Link>

          <Link
            href="/feed"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            Ir al feed →
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">Reglas del Ethiqia Score</h1>
        <p className="text-sm text-neutral-400 mt-2">
          Objetivo: que el score sea estable, con crecimiento limitado, basado en hitos (no por “spam”
          de actividad). El score se compone por bloques.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Base</div>
            <p className="text-sm text-neutral-300 mt-2">
              Todo el mundo empieza con <span className="font-semibold text-white">50</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Bloque 1: Transparencia</div>
            <p className="text-sm text-neutral-300 mt-2">
              +2 puntos cuando completas el perfil mínimo. Se concede una vez.
            </p>
            <ul className="mt-3 text-sm text-neutral-300 list-disc pl-5 space-y-1">
              <li>Nombre</li>
              <li>@username</li>
              <li>País (location)</li>
              <li>Avatar</li>
              <li>Bio (mínimo de caracteres si lo exiges)</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Bloque 2: Buena conducta</div>
            <p className="text-sm text-neutral-300 mt-2">
              Sistema por hitos trimestrales. Si mantienes conducta limpia, ganas hitos.
            </p>
            <ul className="mt-3 text-sm text-neutral-300 list-disc pl-5 space-y-1">
              <li>+2 puntos por cada 90 días “clean” (máx. 4 hitos/año = +8)</li>
              <li>
                Strike por mala conducta: <span className="font-semibold text-white">-10 inmediato</span>
                (no se espera a fin de año)
              </li>
              <li>Cap de seguridad de penalización anual (configurable)</li>
            </ul>
            <p className="text-xs text-neutral-500 mt-3">
              Nota: En v1 el “clean start” se calcula desde el inicio del año, la creación del usuario y el último
              strike (lo más reciente).
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Bloque 3: Participación</div>
            <p className="text-sm text-neutral-300 mt-2">
              No se otorgan puntos por post individual. Se mide por meses activos.
            </p>
            <ul className="mt-3 text-sm text-neutral-300 list-disc pl-5 space-y-1">
              <li>Mes activo = al menos 1 post en ese mes</li>
              <li>Hitos: 2/4/6/8/10/12 meses</li>
              <li>+1 por cada hito (máx. +6)</li>
            </ul>
            <p className="text-xs text-neutral-500 mt-3">
              La UI puede mostrar el “siguiente hito” y notificar “te falta 1 mes activo para el siguiente punto”.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Evolución anual</div>
            <p className="text-sm text-neutral-300 mt-2">
              Primer año: consolidas fundamentos (base + transparencia + conducta + participación).
              Años siguientes: demostrar consistencia, no crecimiento infinito.
            </p>
            <p className="text-xs text-neutral-500 mt-3">
              (Esto lo implementaremos después, cuando definamos “cap anual” y “acumulación por años” hasta 75–98.)
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-700/40 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-emerald-300">Estado actual</div>
          <p className="text-sm text-neutral-200 mt-2">
            Ahora mismo ya estás en la versión “hitos capados” con transparencia (+2), conducta trimestral (+2 por 90
            días clean, cap +8) y participación por meses (cap +6), más strikes -10 inmediatos.
          </p>
        </div>
      </section>
    </main>
  );
}
