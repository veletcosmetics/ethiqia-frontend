"use client";

import React, { useState } from "react";
import { companyData, type CompanyData } from "@/lib/companyMock";
import { ReviewCard } from "@/components/company/ReviewCard";
import { ScoreBreakdown } from "@/components/company/ScoreBreakdown";
import { MetricsSummary } from "@/components/company/MetricsSummary";
import { ActivityChart } from "@/components/company/ActivityChart";

export default function CompanyPage() {
  const data: CompanyData = companyData;

  const [openEvidenceIndex, setOpenEvidenceIndex] = useState<number | null>(
    null
  );

  const [reviewResponses, setReviewResponses] = useState<
    Record<number, string>
  >(
    data.reviews.reduce((acc, review, index) => {
      acc[index] = review.response ?? "";
      return acc;
    }, {} as Record<number, string>)
  );

  const handleChangeResponse = (index: number, newVal: string) => {
    setReviewResponses((prev) => ({ ...prev, [index]: newVal }));
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 pb-20">
      <section className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* CABECERA EMPRESA */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/80 to-sky-500/80 flex items-center justify-center text-2xl font-semibold shadow-lg shadow-emerald-500/30">
              <span>V</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{data.name}</h1>

                {data.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300">
                    ✓ Empresa verificada (demo)
                  </span>
                )}
              </div>

              <p className="text-sm text-neutral-400">
                {data.sector} · {data.country}
              </p>

              <p className="text-xs text-neutral-500 max-w-xl">
                Perfil profesional demo que muestra cómo Ethiqia valida la
                reputación de una empresa a través de evidencias, actividad y
                datos verificables, usando Velet como caso realista.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Perfil empresarial
            </p>
            <p className="text-sm text-neutral-400 max-w-xs md:text-right">
              Pensado para explicar a administraciones, inversores y partners
              cómo funcionaría Ethiqia con datos reales de una empresa.
            </p>
          </div>
        </header>

        {/* MÉTRICAS PRINCIPALES */}
        <MetricsSummary metrics={data.kpiMetrics} />

        {/* DESGLOSE ETHIQIA SCORE */}
        <ScoreBreakdown items={data.scoreBreakdown} />

        {/* APIS ACTIVAS CON DESCRIPCIÓN */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-neutral-100 mb-3">
            APIs activas (demo) – Qué hace cada una
          </h2>

          <p className="text-xs text-neutral-500 mb-4 max-w-2xl">
            Ethiqia no se conecta “a todo Internet”. Se conecta a muy pocos
            puntos clave: ventas reales, actividad profesional, soporte y
            documentación. Estas APIs están pensadas para ser simples y
            controlables por Velet.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {data.apis.map((api, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-neutral-100">
                  {api.title}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {api.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA PARA CLÍNICAS (VERSIÓN SIMPLE) */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-neutral-100 mb-3">
            Cómo funciona para clínicas (versión simple)
          </h2>

          <p className="text-xs text-neutral-500 mb-4 max-w-2xl">
            Para una clínica, Ethiqia se resume en dos pasos: compras reales a
            Velet y visitas validadas de clientes. Nada de datos médicos,
            solo actividad profesional real.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {data.clinicFlows.map((flow, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-neutral-100">
                  {flow.title}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {flow.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CERTIFICACIONES CON EVIDENCIA */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-100 mt-12 mb-4">
            Certificaciones validadas
          </h2>

          <div className="space-y-3">
            {data.certifications.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/70"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-neutral-100">{item.title}</p>
                    <p className="text-sm text-neutral-500">{item.date}</p>
                    <p className="text-xs text-emerald-400 mt-1">
                      +{item.points.toFixed(1)} en Ethiqia Score
                    </p>
                  </div>

                  {item.hasEvidence && (
                    <button
                      onClick={() =>
                        setOpenEvidenceIndex(
                          openEvidenceIndex === idx ? null : idx
                        )
                      }
                      className="text-xs px-3 py-1 border border-neutral-700 rounded-full bg-neutral-800 hover:bg-neutral-700 transition"
                    >
                      {openEvidenceIndex === idx
                        ? "Ocultar evidencia"
                        : "Ver evidencia"}
                    </button>
                  )}
                </div>

                {openEvidenceIndex === idx && (
                  <div className="mt-3 p-3 text-xs text-neutral-300 bg-neutral-800/60 border border-neutral-700 rounded-lg">
                    {item.evidenceDescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVIDAD VALIDADA */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-100 mt-12 mb-4">
            Actividad validada reciente
          </h2>

          <div className="space-y-3">
            {data.activity.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/70"
              >
                <p className="font-medium text-neutral-100">{item.title}</p>
                <p className="text-sm text-neutral-500">{item.date}</p>
                <p className="text-xs text-emerald-400 mt-1">
                  +{item.points.toFixed(1)} puntos
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GRÁFICO DE ACTIVIDAD MENSUAL */}
        <ActivityChart data={data.monthlyActivity} />

        {/* RESEÑAS VERIFICADAS */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-100 mt-12 mb-4">
            Reseñas verificadas (demo)
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            Todas las reseñas están asociadas a compras reales. La empresa
            puede responder desde su panel profesional.
          </p>

          {data.reviews.map((review, i) => (
            <ReviewCard
              key={i}
              review={review}
              allowEditResponse
              responseOverride={reviewResponses[i]}
              onChangeResponse={(val: string) => handleChangeResponse(i, val)}
            />
          ))}
        </section>
      </section>
    </main>
  );
}
