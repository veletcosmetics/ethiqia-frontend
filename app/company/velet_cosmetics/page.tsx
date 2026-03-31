"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { companyData, type CompanyData } from "@/lib/companyMock";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import { ScoreBreakdown } from "@/components/company/ScoreBreakdown";
import { MetricsSummary } from "@/components/company/MetricsSummary";

export default function CompanyPage() {
  const data: CompanyData = companyData;

  const [logoError, setLogoError] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [admin, setAdmin] = useState<{ id: string; full_name: string; avatar_url: string | null } | null>(null);
  const [activity, setActivity] = useState<{ title: string; date: string; points: number }[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);

  // Documentos desde Supabase (con fallback hardcodeado)
  const [documents, setDocuments] = useState<{ name: string; doc_type: string; verified: boolean }[]>([
    { name: "Registro CPNP — 18 productos", doc_type: "Certificacion", verified: true },
    { name: "FDA MOCRA Registration", doc_type: "Certificacion", verified: true },
    { name: "Acuerdo colaboracion AITEX", doc_type: "Contrato", verified: true },
    { name: "Certificacion Vegana — PETA", doc_type: "Certificacion", verified: true },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
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

      // Intentar cargar documentos desde Supabase
      try {
        const { data: docs, error } = await supabaseBrowser
          .from("company_documents")
          .select("name, doc_type, verified")
          .eq("company_handle", "velet_cosmetics")
          .order("uploaded_at", { ascending: false });

        if (!error && docs && docs.length > 0) {
          setDocuments(docs as any);
        }
      } catch { /* usar fallback hardcodeado */ }

      // Cargar actividad verificada desde Supabase
      try {
        const { data: events, error } = await supabaseBrowser
          .from("reputation_events")
          .select("event_type, points, created_at, metadata")
          .eq("subject_type", "company")
          .eq("subject_id", "velet_cosmetics")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && events && events.length > 0) {
          setActivity(events.map((ev: any) => ({
            title: ev.metadata?.title ?? ev.event_type ?? "Evento verificado",
            date: new Date(ev.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
            points: ev.points ?? 0,
          })));
        }
      } catch { /* no-op */ }
      setActivityLoaded(true);
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 pb-20">
      <section className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* NAV */}
        <Link href="/" className="text-xs text-neutral-500 hover:text-emerald-400 transition-colors">
          ← Inicio
        </Link>

        {/* CABECERA */}
        <header className="space-y-4">
          <div className="flex gap-5 items-center">
            <div className="w-[160px] h-[80px] rounded-2xl bg-[#f5f5f5] flex items-center justify-center shadow-lg shadow-emerald-500/10 overflow-hidden shrink-0">
              {logoError ? (
                <span className="text-2xl font-semibold text-white">VC</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/logo-velet.png" alt={data.name} className="w-full h-full object-contain p-2" onError={() => setLogoError(true)} />
              )}
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
              <p className="text-sm text-neutral-400">{data.sector} · {data.country}</p>
              <p className="text-xs text-neutral-500">Fundada en 2019</p>
              <p className="text-xs text-neutral-500 max-w-xl mt-1">
                Ethiqia valida la reputacion de una empresa a traves de evidencias, actividad y datos verificables.
              </p>
            </div>
          </div>
        </header>

        {/* METRICAS */}
        <MetricsSummary metrics={data.kpiMetrics} />

        {/* SCORE + TIPS */}
        <ScoreBreakdown items={data.scoreBreakdown} />

        {/* ODS */}
        <section className="mt-6 rounded-2xl border border-neutral-800 bg-emerald-950/20 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Alineacion Agenda 2030</h2>
          <p className="text-xs text-neutral-400 max-w-2xl">
            El Ethiqia Score de Velet Cosmetics se mapea con los siguientes Objetivos de Desarrollo Sostenible de la ONU.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white">ODS 3 · Salud y bienestar</span>
            <span className="rounded-full bg-red-700 px-3 py-1.5 text-[11px] font-semibold text-white">ODS 8 · Trabajo decente</span>
            <span className="rounded-full bg-orange-600 px-3 py-1.5 text-[11px] font-semibold text-white">ODS 9 · Innovacion</span>
            <span className="rounded-full bg-amber-700 px-3 py-1.5 text-[11px] font-semibold text-white">ODS 12 · Produccion responsable</span>
            <span className="rounded-full bg-blue-700 px-3 py-1.5 text-[11px] font-semibold text-white">ODS 16 · Instituciones solidas</span>
          </div>
        </section>

        {/* HERRAMIENTAS ACTIVAS */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-100 mb-3">Aplicaciones y herramientas activas</h2>
          <p className="text-xs text-neutral-500 mb-4 max-w-2xl">
            Herramientas vinculadas que generan datos verificados automaticamente para el Ethiqia Score.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "PrestaShop", initials: "PS", bg: "bg-[#DF0067]", status: "Activo", statusColor: "text-emerald-400", detail: "Eventos en tiempo real", points: "+15 pts Actividad verificada" },
              { name: "Ecoembes", initials: "EC", bg: "bg-[#00843D]", status: "Declarado", statusColor: "text-amber-400", detail: "Gestion de envases", points: "+10 pts Sostenibilidad" },
              { name: "Stripe", initials: "ST", bg: "bg-[#635BFF]", status: "Declarado", statusColor: "text-amber-400", detail: "Pagos verificados", points: "+10 pts Confianza B2B" },
              { name: "CPNP (UE)", initials: "EU", bg: "bg-[#003399]", status: "Verificado oficialmente", statusColor: "text-emerald-400", detail: "18 productos registrados", points: "+20 pts Transparencia" },
              { name: "FDA MOCRA", initials: "FDA", bg: "bg-[#1B4F72]", status: "Verificado oficialmente", statusColor: "text-emerald-400", detail: "6 productos registrados", points: "+20 pts Transparencia" },
            ].map((tool) => (
              <div key={tool.name} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-xl ${tool.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {tool.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-100">{tool.name}</p>
                    <p className={`text-[11px] font-medium ${tool.statusColor}`}>{tool.status}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400">{tool.detail}</p>
                <p className="text-[11px] text-emerald-400 mt-1.5">{tool.points}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DOCUMENTACION (desde Supabase con fallback) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-100">Documentacion y certificaciones</h2>
            {admin && (
              <label className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingDoc(true);
                    try {
                      const { data: session } = await supabaseBrowser.auth.getSession();
                      const token = session.session?.access_token;
                      if (!token) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      await fetch("/api/upload", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      });
                    } catch { /* no-op */ }
                    finally { setUploadingDoc(false); e.target.value = ""; }
                  }}
                />
                {uploadingDoc ? "Subiendo..." : "Subir documento"}
              </label>
            )}
          </div>
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/70">
                <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-200 truncate">{doc.name}</p>
                  <p className="text-[10px] text-neutral-500">{doc.doc_type}</p>
                </div>
                {doc.verified && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0">
                    Verificado
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVIDAD VERIFICADA (desde Supabase) */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-100 mb-4">Actividad verificada reciente</h2>
          {!activityLoaded ? (
            <div className="flex items-center gap-2 py-4 text-neutral-500">
              <div className="w-4 h-4 border-2 border-neutral-700 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs">Cargando actividad...</span>
            </div>
          ) : activity.length === 0 ? (
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/70 text-center">
              <p className="text-xs text-neutral-500">Actividad en tiempo real aparecera aqui segun se generen eventos verificados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/70">
                  <p className="font-medium text-neutral-100">{item.title}</p>
                  <p className="text-sm text-neutral-500">{item.date}</p>
                  {item.points > 0 && <p className="text-xs text-emerald-400 mt-1">+{item.points} puntos</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADMINISTRADOR */}
        {admin && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
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
