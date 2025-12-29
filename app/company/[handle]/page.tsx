"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import {
  BadgeCheck,
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  Link as LinkIcon,
  Shield,
  Zap,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Palette,
  ShoppingBag,
  BarChart3,
  Briefcase,
  FileText,
  LayoutGrid,
} from "lucide-react";

type CompanyProfile = {
  id: string;
  handle: string;
  legal_name: string;
  display_name: string;
  country: string | null;
  jurisdiction: string | null;
  website: string | null;
  sector: string | null;
  company_type: string | null;
  founded_year: number | null;
  size_range: string | null;
  logo_url: string | null;
  bio: string | null;

  owner_user_id: string | null;

  verified: boolean;
  verification_level: "declared" | "verified" | "strong" | string;
  ethq_score: number;

  created_at: string;
  updated_at: string;
};

type CompanyTool = {
  id: string;
  company_id: string;
  tool_key: string;
  display_name: string;
  status: "declared" | "verified" | "active" | string;
  url: string | null;
  notes: string | null;
};

function clampScore(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreLabel(score: number) {
  if (score >= 85) return "Muy alta";
  if (score >= 70) return "Alta";
  if (score >= 50) return "Media";
  if (score >= 30) return "Baja";
  return "Muy baja";
}

function statusMeta(status: string) {
  // Visualmente: no usamos color fijo para no encasillarnos. Pero sí iconografía clara.
  if (status === "active") return { icon: <Zap size={16} />, text: "Activo en Ethiqia" };
  if (status === "verified") return { icon: <CheckCircle2 size={16} />, text: "Verificado" };
  return { icon: <HelpCircle size={16} />, text: "Declarado" };
}

function toolIcon(toolKey: string) {
  // Iconos genéricos (sin logos de marcas para evitar líos). Si luego quiere SVGs oficiales, lo hacemos.
  switch (toolKey) {
    case "stripe":
      return <CreditCard size={18} />;
    case "canva":
      return <Palette size={18} />;
    case "shopify":
    case "woocommerce":
      return <ShoppingBag size={18} />;
    case "google_analytics":
      return <BarChart3 size={18} />;
    case "holded":
    case "quickbooks":
    case "xero":
      return <FileText size={18} />;
    case "notion":
    case "jira":
      return <LayoutGrid size={18} />;
    case "github":
      return <Briefcase size={18} />;
    default:
      return <LinkIcon size={18} />;
  }
}

export default function CompanyPublicProfilePage({ params }: { params: { handle: string } }) {
  const handle = params.handle;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [tools, setTools] = useState<CompanyTool[]>([]);
  const [error, setError] = useState<string | null>(null);

  const score = useMemo(() => clampScore(company?.ethq_score ?? 0), [company?.ethq_score]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // 1) Load company by handle
      const { data: cp, error: cpErr } = await supabaseBrowser
        .from("company_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (cancelled) return;

      if (cpErr) {
        setError(cpErr.message);
        setCompany(null);
        setTools([]);
        setLoading(false);
        return;
      }

      if (!cp) {
        setError("Empresa no encontrada.");
        setCompany(null);
        setTools([]);
        setLoading(false);
        return;
      }

      setCompany(cp as CompanyProfile);

      // 2) Load tools
      const { data: t, error: tErr } = await supabaseBrowser
        .from("company_tools")
        .select("*")
        .eq("company_id", cp.id)
        .order("display_name", { ascending: true });

      if (cancelled) return;

      if (tErr) {
        setTools([]);
      } else {
        setTools((t ?? []) as CompanyTool[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-sm opacity-70">Cargando perfil de empresa…</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-lg font-semibold">Perfil de empresa</div>
        <div className="mt-2 text-sm opacity-80">{error ?? "Error desconocido."}</div>
        <div className="mt-6">
          <Link className="text-sm underline" href="/">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const verificationText =
    company.verification_level === "strong"
      ? "Verificación fuerte"
      : company.verification_level === "verified"
      ? "Verificación verificada"
      : "Declarado";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.display_name} fill className="object-cover" />
          ) : (
            <Building2 />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-2xl font-semibold">{company.display_name}</div>
            {company.verified ? (
              <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-black/5">
                <BadgeCheck size={16} />
                Empresa verificada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-black/5">
                <Shield size={16} />
                Sin verificación
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap text-sm opacity-80">
            {(company.country || company.jurisdiction) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={16} />
                {[company.country, company.jurisdiction].filter(Boolean).join(" · ")}
              </span>
            )}
            {company.company_type && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={16} />
                {company.company_type}
              </span>
            )}
            {company.size_range && (
              <span className="inline-flex items-center gap-1">
                <Users size={16} />
                {company.size_range}
              </span>
            )}
            {company.founded_year && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={16} />
                {company.founded_year}
              </span>
            )}
          </div>

          {company.website && (
            <div className="mt-2 text-sm">
              <a className="inline-flex items-center gap-2 underline" href={company.website} target="_blank" rel="noreferrer">
                <Globe size={16} />
                {company.website}
              </a>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="min-w-[140px] rounded-2xl border border-black/10 p-4 text-center">
          <div className="text-xs opacity-70">Ethiqia Score</div>
          <div className="text-3xl font-semibold">{score}</div>
          <div className="text-xs opacity-70">{scoreLabel(score)}</div>
        </div>
      </div>

      {/* Info blocks */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-black/10 p-4">
          <div className="text-sm font-semibold">Información</div>
          <div className="mt-3 space-y-2 text-sm opacity-90">
            {company.sector && <div><span className="opacity-70">Sector:</span> {company.sector}</div>}
            <div><span className="opacity-70">Verificación:</span> {verificationText}</div>
            <div><span className="opacity-70">Handle:</span> @{company.handle}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 p-4">
          <div className="text-sm font-semibold">Descripción</div>
          <div className="mt-3 text-sm opacity-90 whitespace-pre-wrap">
            {company.bio?.trim() ? company.bio : "Esta empresa aún no ha añadido una descripción."}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="mt-6 rounded-2xl border border-black/10 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Herramientas vinculadas</div>
            <div className="text-xs opacity-70">
              Indicadores operativos: declarado, verificado o activo en Ethiqia.
            </div>
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="mt-4 text-sm opacity-80">Aún no hay herramientas registradas.</div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {tools.map((t) => {
              const meta = statusMeta(t.status);
              return (
                <div
                  key={t.id}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm"
                  title={`${t.display_name} · ${meta.text}`}
                >
                  <span className="opacity-80">{toolIcon(t.tool_key)}</span>
                  <span>{t.display_name}</span>
                  <span className="opacity-70">{meta.icon}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer actions (placeholder) */}
      <div className="mt-8 flex items-center gap-3">
        <Link className="text-sm underline" href="/">
          Volver
        </Link>
        <span className="text-xs opacity-60">
          Próximo: panel de edición (solo owner/admin) + conexión real OAuth/API.
        </span>
      </div>
    </div>
  );
}
