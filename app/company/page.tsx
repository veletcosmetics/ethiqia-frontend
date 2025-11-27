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

  // Estado local para respuestas editables de las reseñas
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
                reputación de una empresa a través de evidencias reales,
                actividad y datos verificables.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              Perfil empresarial
            </p>
            <p className="text-sm text-neutral-400 max-w-xs md:text-right">
              Este perfil sirve para mostrar a administraciones públicas,
              inversores y empresas cómo funcionaría Ethiqia en la práctica.
            </p>
          </div>
        </header>

        {/* MÉTRICAS PRINCIPALES */}
        <MetricsSummary metrics={data.kpiMetrics} />

        {/* DESGLOSE ETHIQIA SCORE */}
        <ScoreBreakdown items={data.scoreBreakdown} />

        {/* APIS ACTIVAS */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-neutral-100 mb-3">
            APIs activas (demo)
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.apis.map((api, i) => (
              <span
                key={i}
                className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-xs text-neutral-300"
              >
                {api}
              </span>
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
            Todas las reseñas están asociadas a tickets reales. La empresa
            puede responder desde su panel.
          </p>

          {data.reviews.map((review, i) => (
            <ReviewCard
              key={i}
              review={review}
              allowEditResponse
              responseOverride={reviewResponses[i]}
              onChangeResponse={(val) => handleChangeResponse(i, val)}
            />
          ))}
        </section>
      </section>
    </main>
  );
}
