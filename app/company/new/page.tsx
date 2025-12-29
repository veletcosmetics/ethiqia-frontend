"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type ToolKey =
  | "stripe"
  | "canva"
  | "holded"
  | "quickbooks"
  | "xero"
  | "shopify"
  | "woocommerce"
  | "google_analytics"
  | "meta_ads"
  | "google_ads"
  | "notion"
  | "jira"
  | "github"
  | "other";

const TOOL_CATALOG: { key: ToolKey; name: string }[] = [
  { key: "stripe", name: "Stripe" },
  { key: "canva", name: "Canva" },
  { key: "holded", name: "Holded" },
  { key: "quickbooks", name: "QuickBooks" },
  { key: "xero", name: "Xero" },
  { key: "shopify", name: "Shopify" },
  { key: "woocommerce", name: "WooCommerce" },
  { key: "google_analytics", name: "Google Analytics" },
  { key: "meta_ads", name: "Meta Ads" },
  { key: "google_ads", name: "Google Ads" },
  { key: "notion", name: "Notion" },
  { key: "jira", name: "Jira" },
  { key: "github", name: "GitHub" },
  { key: "other", name: "Otra" },
];

function slugifyHandle(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-");
}

export default function NewCompanyPage() {
  const router = useRouter();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos (pre-rellenados para Velet; el usuario podrá cambiarlos)
  const [displayName, setDisplayName] = useState("Velet Cosmetics");
  const [legalName, setLegalName] = useState("Velet.coop V");
  const [handleRaw, setHandleRaw] = useState("velet_cosmetics");
  const [website, setWebsite] = useState("https://veletcosmetics.com");
  const [country, setCountry] = useState("España");
  const [jurisdiction, setJurisdiction] = useState("Comunidad Valenciana");
  const [sector, setSector] = useState("Cosmética profesional");
  const [companyType, setCompanyType] = useState("Pyme / Cooperativa");
  const [sizeRange, setSizeRange] = useState("1-10");
  const [bio, setBio] = useState(
    "Cosmética vegana profesional para centros estéticos y clínicas. Fabricación e I+D."
  );

  const handle = useMemo(() => slugifyHandle(handleRaw), [handleRaw]);

  const [selectedTools, setSelectedTools] = useState<ToolKey[]>([
    "stripe",
    "canva",
    "holded",
    "github",
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoadingAuth(true);
      const { data, error } = await supabaseBrowser.auth.getUser();
      if (cancelled) return;

      if (error || !data?.user) {
        setUserId(null);
        setLoadingAuth(false);
        return;
      }

      setUserId(data.user.id);
      setLoadingAuth(false);
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTool(t: ToolKey) {
    setSelectedTools((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      return [...prev, t];
    });
  }

  async function onCreateCompany() {
    setError(null);

    if (!userId) {
      setError("Debe iniciar sesión para crear una empresa.");
      return;
    }
    if (!handle || handle.length < 3) {
      setError("Handle inválido. Use mínimo 3 caracteres (a-z, 0-9, _ o -).");
      return;
    }
    if (!displayName.trim() || !legalName.trim()) {
      setError("Faltan campos obligatorios: nombre comercial y nombre legal.");
      return;
    }

    setSaving(true);

    // 1) Crear empresa (requiere tabla company_profiles + policy insert)
    const { data: inserted, error: insErr } = await supabaseBrowser
      .from("company_profiles")
      .insert({
        handle,
        legal_name: legalName.trim(),
        display_name: displayName.trim(),
        website: website.trim() || null,
        country: country.trim() || null,
        jurisdiction: jurisdiction.trim() || null,
        sector: sector.trim() || null,
        company_type: companyType.trim() || null,
        size_range: sizeRange.trim() || null,
        bio: bio.trim() || null,
        owner_user_id: userId,
        verified: false,
        verification_level: "declared",
        ethq_score: 50,
      })
      .select("id, handle")
      .single();

    if (insErr || !inserted) {
      setSaving(false);
      setError(insErr?.message ?? "No se pudo crear la empresa (revise RLS o handle duplicado).");
      return;
    }

    const companyId = inserted.id as string;

    // 2) Insertar herramientas (declaradas)
    if (selectedTools.length > 0) {
      const rows = selectedTools.map((k) => {
        const found = TOOL_CATALOG.find((t) => t.key === k);
        return {
          company_id: companyId,
          tool_key: k,
          display_name: found?.name ?? k,
          status: "declared",
        };
      });

      const { error: toolsErr } = await supabaseBrowser.from("company_tools").insert(rows);
      if (toolsErr) console.warn("tools insert error", toolsErr.message);
    }

    setSaving(false);

    // 3) Redirigir al panel
    router.push(`/company/${handle}/edit`);
  }

  if (loadingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-sm opacity-70">Cargando…</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-xl font-semibold">Crear cuenta de empresa</div>
        <div className="mt-2 text-sm opacity-80">Debe iniciar sesión primero.</div>
        <div className="mt-6">
          <Link className="text-sm underline" href="/">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-semibold">Crear cuenta de empresa</div>
          <div className="text-sm opacity-70">
            Se registra como usuario normal, y aquí crea su perfil de empresa con panel propio.
          </div>
        </div>
        <Link className="text-sm underline" href="/">
          Volver
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-black/10 p-4 text-sm">
          <div className="font-semibold">Error</div>
          <div className="mt-1 opacity-80">{error}</div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-black/10 p-5">
        <div className="text-sm font-semibold">Identidad</div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="text-sm">
            <div className="opacity-70">Nombre comercial</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Nombre legal</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Handle (URL)</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={handleRaw} onChange={(e) => setHandleRaw(e.target.value)} />
            <div className="mt-1 text-xs opacity-60">
              Público: <span className="font-mono">/company/{handle || "…"}</span>
            </div>
          </label>

          <label className="text-sm">
            <div className="opacity-70">Web</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 p-5">
        <div className="text-sm font-semibold">Información operativa</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="opacity-70">País</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Jurisdicción</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Sector</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={sector} onChange={(e) => setSector(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Tipo</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={companyType} onChange={(e) => setCompanyType(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Tamaño</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={sizeRange} onChange={(e) => setSizeRange(e.target.value)} />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <div className="opacity-70">Bio</div>
          <textarea className="mt-1 w-full min-h-[90px] rounded-xl border border-black/10 px-3 py-2" value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 p-5">
        <div className="text-sm font-semibold">Apps / herramientas vinculadas</div>
        <div className="text-xs opacity-70 mt-1">
          De momento quedan “Declaradas”. Luego las marcamos “Verificadas” o “Activas” por integración real.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TOOL_CATALOG.map((t) => {
            const on = selectedTools.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleTool(t.key)}
                className={`text-sm rounded-full border px-3 py-2 ${
                  on ? "border-black/30 bg-black/5" : "border-black/10"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={saving}
          onClick={onCreateCompany}
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold"
        >
          {saving ? "Creando…" : "Crear empresa"}
        </button>

        <Link className="text-sm underline" href={`/company/${handle || "velet_cosmetics"}`}>
          Ver público
        </Link>
      </div>
    </div>
  );
}
