// app/company/page.tsx

"use client";

import React, { useState } from "react";
import {
  companyData,
  type CompanyData
} from "@/lib/companyMock";
import { ReviewCard } from "@/components/company/ReviewCard";
import { ScoreBreakdown } from "@/components/company/ScoreBreakdown";
import { MetricsSummary } from "@/components/company/MetricsSummary";
import { ActivityChart } from "@/components/company/ActivityChart";

export default function CompanyPage() {
  const data: CompanyData = companyData;
  const [openEvidenceIndex, setOpenEvidenceIndex] = useState<number | null>(
    null
  );

  // Estado local para respuestas editables en reseñas
  const [reviewResponses, setReviewResponses] = useState<
    Record<number, string>
  >(
    data.reviews.reduce((acc, review, index) => {
      acc[index] = review.response ?? "";
      return acc;
    }, {} as Record<number, string>)
  );

  const handleChangeResponse = (index: number, newValue: string) => {
    setReviewResponses((prev) => ({
      ...prev,
      [index]: newValue
    }));
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10">
      {/* HEADER EMPRESA */}
      <section className="text-center">
        <h1 className="text-4xl font-bold">{data.name}</h1>
        <p className="text-gray-600 mt-2">{data.sector}</p>
        <p className="text-sm text-gray-500">{data.country}</p>

        <div className="mt-3 flex flex-col items-center gap-2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
            ✔ Empresa Verificada Ethiqia
          </span>
          <p className="text-3xl mt-2 font-bold text-green-600">
            {data.score.toFixed(1)} / 100
          </p>
          <p className="text-xs text-gray-500">
            Ethiqia Score demo basado en ventas, registros, impacto social,
            sostenibilidad y cumplimiento regulatorio.
          </p>
        </div>
      </section>

      {/* APIS ACTIVAS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">APIs activas (demo)</h2>
        <div className="flex flex-wrap gap-2">
          {data.apis.map((api, i) => (
            <span
              key={i}
              className="bg-gray-200 px-3 py-1 rounded-full text-sm shadow-sm"
            >
              {api}
            </span>
          ))}
        </div>
      </section>

      {/* MÉTRICAS TIPO DASHBOARD */}
      <MetricsSummary metrics={data.kpiMetrics} />

      {/* DESGLOSE ETHIQIA SCORE */}
      <ScoreBreakdown items={data.scoreBreakdown} />

      {/* CERTIFICACIONES CON EVIDENCIA */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Certificaciones validadas
        </h2>
        <div className="space-y-3">
          {data.certifications.map((item, i) => (
            <div
              key={i}
              className="p-4 border rounded-lg bg-gray-50 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500">{item.date}</p>
                  <p className="text-xs text-green-700 mt-1">
                    +{item.points.toFixed(1)} puntos en Ethiqia Score
                  </p>
                </div>
                {item.hasEvidence && (
                  <button
                    onClick={() =>
                      setOpenEvidenceIndex(
                        openEvidenceIndex === i ? null : i
                      )
                    }
                    className="text-xs px-3 py-1 border rounded-full bg-white hover:bg-gray-100"
                  >
                    {openEvidenceIndex === i
                      ? "Ocultar evidencia"
                      : "Ver evidencia"}
                  </button>
                )}
              </div>

              {openEvidenceIndex === i && item.evidenceDescription && (
                <div className="mt-3 p-3 bg-white border rounded-lg text-xs text-gray-700">
                  {item.evidenceDescription}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVIDAD VALIDADA (LISTA) */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Actividad validada reciente
        </h2>
        <div className="space-y-3">
          {data.activity.map((item, i) => (
            <div
              key={i}
              className="p-4 border rounded-lg bg-white shadow-sm"
            >
              <p className="font-semibold text-gray-900">
                {item.title}
              </p>
              <p className="text-sm text-gray-500">{item.date}</p>
              <p className="text-xs text-green-700 mt-1">
                +{item.points.toFixed(1)} puntos en Ethiqia Score
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* GRÁFICO MENSUAL */}
      <ActivityChart data={data.monthlyActivity} />

      {/* RESEÑAS VERIFICADAS */}
      <section className="mt-12 mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Reseñas verificadas (demo sistema propio Ethiqia)
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Todas las reseñas están vinculadas a compras reales (tickets
          verificados) y pueden responderse desde el panel de empresa.
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
    </div>
  );
}
