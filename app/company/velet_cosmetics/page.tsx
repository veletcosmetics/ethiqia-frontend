"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { companyData, type CompanyData } from "@/lib/companyMock";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
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

  const [admin, setAdmin] = useState<{ id: string; full_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        // Buscar el primer usuario que tenga full_name que contenga "David"
        // o el usuario logueado actual como admin de la empresa
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        if (user) {
          const { data: prof } = await supabaseBrowser
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.full_name) setAdmin(prof as any);
        }
      } catch { /* no-op */ }
    };
    loadAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 pb-20">
      <section className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* CABECERA EMPRESA */}
        <header className="space-y-4">
          <div className="flex gap-5 items-center">
            <div className="w-[160px] h-[80px] rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-lg shadow-emerald-500/10 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-velet.png" alt={data.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; e.currentTarget.parentElement!.innerHTML = "<span class='text-2xl font-semibold'>V</span>"; }} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{data.name}</h1>

                {data.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300">
                    ✓ Empresa verificada
                  </span>
                )}
              </div>

              <p className="text-sm text-neutral-400">
                {data.sector} · {data.country}
              </p>

              <p className="text-xs text-neutral-500 max-w-xl">
                Ethiqia valida la reputacion de una empresa a traves de
                evidencias, actividad y datos verificables.
              </p>
            </div>
          </div>
        </header>

        {/* MÉTRICAS PRINCIPALES */}
        <MetricsSummary metrics={data.kpiMetrics} />

        {/* DESGLOSE ETHIQIA SCORE */}
        <ScoreBreakdown items={data.scoreBreakdown} />

        {/* APIS ACTIVAS CON DESCRIPCIÓN */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-neutral-100 mb-3">
            APIs activas
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
            Resenas verificadas
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

        {/* ADMINISTRADOR VINCULADO */}
        {admin && (
          <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Administrador vinculado</h2>
            <Link href={`/u/${admin.id}`} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
                {admin.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={admin.avatar_url} alt={admin.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{admin.full_name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">{admin.full_name}</p>
                <p className="text-[11px] text-neutral-500">Administrador de {data.name}</p>
              </div>
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
