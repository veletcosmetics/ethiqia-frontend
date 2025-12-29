"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

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
  verification_level: string;
  ethq_score: number;
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

function slugifyKey(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-");
}

export default function CompanyEditPage({ params }: { params: { handle: string } }) {
  const router = useRouter();
  const handle = params.handle;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [tools, setTools] = useState<CompanyTool[]>([]);
  const [error, setError] = useState<string | null>(null);

  // form
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sector, setSector] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [sizeRange, setSizeRange] = useState("");
  const [bio, setBio] = useState("");

  // tool form
  const [newToolKey, setNewToolKey] = useState("");
  const [newToolName, setNewToolName] = useState("");
  const [newToolStatus, setNewToolStatus] = useState<"declared" | "verified" | "active">("declared");

  const isOwner = useMemo(() => {
    if (!viewerId || !company?.owner_user_id) return false;
    return viewerId === company.owner_user_id;
  }, [viewerId, company?.owner_user_id]);

  async function reloadTools(companyId: string) {
    const { data: t } = await supabaseBrowser
      .from("company_tools")
      .select("*")
      .eq("company_id", companyId)
      .order("display_name", { ascending: true });
    setTools((t ?? []) as CompanyTool[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: u } = await supabaseBrowser.auth.getUser();
      const uid = u?.user?.id ?? null;
      if (!cancelled) setViewerId(uid);

      const { data: cp, error: cpErr } = await supabaseBrowser
        .from("company_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (cancelled) return;

      if (cpErr) {
        setError(cpErr.message);
        setLoading(false);
        return;
      }

      if (!cp) {
        setError("Empresa no encontrada.");
        setLoading(false);
        return;
      }

      const c = cp as CompanyProfile;
      setCompany(c);

      // precarga
      setDisplayName(c.display_name ?? "");
      setLegalName(c.legal_name ?? "");
      setWebsite(c.website ?? "");
      setCountry(c.country ?? "");
      setJurisdiction(c.jurisdiction ?? "");
      setSector(c.sector ?? "");
      setCompanyType(c.company_type ?? "");
      setSizeRange(c.size_range ?? "");
      setBio(c.bio ?? "");

      await reloadTools(c.id);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  async function saveProfile() {
    setError(null);
    if (!viewerId) {
      setError("Debe iniciar sesión.");
      return;
    }
    if (!company) return;

    setSaving(true);

    const { error: upErr } = await supabaseBrowser
      .from("company_profiles")
      .update({
        display_name: displayName.trim(),
        legal_name: legalName.trim(),
        website: website.trim() || null,
        country: country.trim() || null,
        jurisdiction: jurisdiction.trim() || null,
        sector: sector.trim() || null,
        company_type: companyType.trim() || null,
        size_range: sizeRange.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", company.id);

    setSaving(false);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    router.refresh();
  }

  async function addTool() {
    setError(null);
    if (!viewerId) {
      setError("Debe iniciar sesión.");
      return;
    }
    if (!company) return;

    const tk = slugifyKey(newToolKey);
    const dn = newToolName.trim();

    if (!tk || !dn) {
      setError("tool_key y nombre son obligatorios.");
      return;
    }

    const { error: insErr } = await supabaseBrowser.from("company_tools").insert({
      company_id: company.id,
      tool_key: tk,
      display_name: dn,
      status: newToolStatus,
    });

    if (insErr) {
      setError(insErr.message);
      return;
    }

    setNewToolKey("");
    setNewToolName("");
    setNewToolStatus("declared");
    await reloadTools(company.id);
  }

  async function updateTool(toolId: string, patch: Partial<CompanyTool>) {
    setError(null);
    const { error: upErr } = await supabaseBrowser.from("company_tools").update(patch).eq("id", toolId);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setTools((prev) => prev.map((x) => (x.id === toolId ? { ...x, ...patch } : x)));
  }

  async function deleteTool(toolId: string) {
    setError(null);
    const { error: delErr } = await supabaseBrowser.from("company_tools").delete().eq("id", toolId);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setTools((prev) => prev.filter((x) => x.id !== toolId));
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-sm opacity-70">Cargando panel de empresa…</div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-xl font-semibold">Panel de empresa</div>
        <div className="mt-2 text-sm opacity-80">{error}</div>
        <div className="mt-6">
          <Link className="text-sm underline" href="/">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-semibold">Panel de empresa</div>
          <div className="text-sm opacity-70">
            {company.display_name} · <span className="font-mono">/company/{company.handle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm underline" href={`/company/${company.handle}`}>
            Ver público
          </Link>
          <Link className="text-sm underline" href="/company/new">
            Crear otra
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-black/10 p-4 text-sm">
          <div className="font-semibold">Aviso</div>
          <div className="mt-1 opacity-80">{error}</div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-black/10 p-5">
        <div className="text-sm font-semibold">Datos de empresa</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="opacity-70">Nombre comercial</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Nombre legal</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Web</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Sector</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={sector} onChange={(e) => setSector(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">País</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={country} onChange={(e) => setCountry(e.target.value)} />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Jurisdicción</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
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

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving || !viewerId}
            onClick={saveProfile}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          {!isOwner ? (
            <div className="text-xs opacity-60">
              Si no es owner/admin, Supabase bloqueará cambios por RLS (correcto).
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 p-5">
        <div className="text-sm font-semibold">Apps / herramientas vinculadas</div>
        <div className="text-xs opacity-70 mt-1">Estados: declared, verified, active.</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">
            <div className="opacity-70">tool_key</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={newToolKey} onChange={(e) => setNewToolKey(e.target.value)} placeholder="stripe" />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Nombre</div>
            <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={newToolName} onChange={(e) => setNewToolName(e.target.value)} placeholder="Stripe" />
          </label>

          <label className="text-sm">
            <div className="opacity-70">Estado</div>
            <select className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" value={newToolStatus} onChange={(e) => setNewToolStatus(e.target.value as any)}>
              <option value="declared">declared</option>
              <option value="verified">verified</option>
              <option value="active">active</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <button type="button" disabled={!viewerId} onClick={addTool} className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold">
            Añadir herramienta
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {tools.length === 0 ? (
            <div className="text-sm opacity-80">Sin herramientas todavía.</div>
          ) : (
            tools.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{t.display_name}</div>
                  <div className="text-xs opacity-70 font-mono truncate">{t.tool_key} · {t.status}</div>
                </div>

                <div className="flex items-center gap-2">
                  <select className="rounded-xl border border-black/10 px-3 py-2 text-sm" value={t.status} onChange={(e) => updateTool(t.id, { status: e.target.value })}>
                    <option value="declared">declared</option>
                    <option value="verified">verified</option>
                    <option value="active">active</option>
                  </select>

                  <button type="button" onClick={() => deleteTool(t.id)} className="rounded-xl border border-black/10 px-3 py-2 text-sm">
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 text-xs opacity-60">
        Próximo: integrar sus componentes antiguos de <span className="font-mono">components/company</span> para mostrar métricas y score breakdown.
      </div>
    </div>
  );
}
