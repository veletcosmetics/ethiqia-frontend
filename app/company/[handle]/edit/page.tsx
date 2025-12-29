"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type CompanyRow = {
  id: string;
  owner_user_id: string | null;
  handle: string;

  legal_name: string | null;
  display_name: string | null;

  country: string | null;
  jurisdiction: string | null;

  website: string | null;
  sector: string | null;
  company_type: string | null;
  size_range: string | null;

  logo_url: string | null;
  bio: string | null;

  verified: boolean | null;
  verification_level: string | null;
  ethq_score: number | null;

  created_at?: string | null;
  updated_at?: string | null;
};

function normalizeUrl(url: string) {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function safeHandle(input: string) {
  return (input || "").trim().toLowerCase().replace(/^@+/, "");
}

export default function CompanyEditPage({ params }: { params: { handle: string } }) {
  const handle = safeHandle(params.handle);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const [saving, setSaving] = useState(false);

  // Campos editables (alineados con tu schema REAL)
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sector, setSector] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [sizeRange, setSizeRange] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const isOwner = useMemo(() => {
    return !!(user?.id && company?.owner_user_id && user.id === company.owner_user_id);
  }, [user?.id, company?.owner_user_id]);

  const loadCompany = async () => {
    setLoadingCompany(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("company_profiles")
        .select(
          "id, owner_user_id, handle, legal_name, display_name, country, jurisdiction, website, sector, company_type, size_range, logo_url, bio, verified, verification_level, ethq_score, created_at, updated_at"
        )
        .eq("handle", handle)
        .maybeSingle();

      if (error) {
        console.error("Error cargando empresa:", error);
        setCompany(null);
        return;
      }

      const row = data ? ((data as unknown) as CompanyRow) : null;
      setCompany(row);

      setDisplayName(row?.display_name ?? "");
      setLegalName(row?.legal_name ?? "");
      setWebsite(row?.website ?? "");
      setCountry(row?.country ?? "");
      setJurisdiction(row?.jurisdiction ?? "");
      setSector(row?.sector ?? "");
      setCompanyType(row?.company_type ?? "");
      setSizeRange(row?.size_range ?? "");
      setBio(row?.bio ?? "");
      setLogoUrl(row?.logo_url ?? "");
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !company?.id) return;

    if (!isOwner) {
      alert("No tienes permiso para editar esta empresa.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<CompanyRow> = {
        display_name: displayName.trim() || null,
        legal_name: legalName.trim() || null,
        website: website.trim() ? normalizeUrl(website) : null,
        country: country.trim() || null,
        jurisdiction: jurisdiction.trim() || null,
        sector: sector.trim() || null,
        company_type: companyType.trim() || null,
        size_range: sizeRange.trim() || null,
        bio: bio.trim() || null,
        logo_url: logoUrl.trim() ? normalizeUrl(logoUrl) : null,
      };

      const { error } = await supabaseBrowser
        .from("company_profiles")
        .update(payload)
        .eq("id", company.id);

      if (error) {
        console.error("Error guardando empresa:", error);
        alert(
          "No se ha podido guardar. Esto casi seguro es RLS/policies en Supabase. Revisa las policies que te pasé y vuelve a probar."
        );
        return;
      }

      await loadCompany();
      alert("Empresa guardada.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setAuthChecked(true);
          window.location.href = "/login";
          return;
        }

        setUser(user);
        await loadCompany();
      } catch (e) {
        console.error("Error init company edit:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </main>
    );
  }

  if (loadingCompany) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando empresa…</p>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/profile" className="text-xs text-neutral-300 hover:text-emerald-400">
            ← Volver a mi perfil
          </Link>
          <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="text-lg font-semibold">Empresa no encontrada</div>
            <div className="text-sm text-neutral-400 mt-2">
              No existe ninguna empresa con handle <span className="text-neutral-200">{handle}</span>.
            </div>
            <div className="text-xs text-neutral-500 mt-3">
              Si sabes que existe, el 90% de las veces es RLS (policies) impidiendo el SELECT en sesión.
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/profile" className="text-xs text-neutral-300 hover:text-emerald-400">
            ← Volver a mi perfil
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/company/${company.handle}`}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
              title="Ver perfil público"
            >
              Ver público
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isOwner || saving}
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
              title={!isOwner ? "Solo el owner puede editar" : "Guardar cambios"}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-semibold">
                  {(company.display_name?.[0] || company.handle?.[0] || "E").toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xl font-semibold truncate">{company.display_name ?? company.handle}</div>
              <div className="text-sm text-neutral-400 truncate">@{company.handle}</div>
              {!isOwner ? (
                <div className="text-xs text-amber-300 mt-1">
                  Estás viendo este panel, pero no eres el owner de esta empresa.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Nombre (display)</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="Velet Cosmetics"
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Nombre legal</label>
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="Velet.coop V"
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Web</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="https://..."
                disabled={!isOwner}
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">País</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="España"
