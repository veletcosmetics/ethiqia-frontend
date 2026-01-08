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

type PurchaseRow = {
  id: string;
  created_at: string;
  user_id: string;
  company_id: string;
  amount_cents: number | null;
  currency: string | null;
  order_id: string | null;
  metadata: any | null;
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

function formatMoney(amount_cents: number | null, currency: string | null) {
  if (typeof amount_cents !== "number") return "—";
  const euros = (amount_cents / 100).toFixed(2);
  return `${euros} ${currency || "EUR"}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function CompanyEditPage({ params }: { params: { handle: string } }) {
  const handle = safeHandle(params.handle);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos editables
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

  // Compras
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);

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

  const loadPurchases = async (companyId: string) => {
    setLoadingPurchases(true);
    setPurchasesError(null);
    try {
      const { data, error } = await supabaseBrowser
        .from("purchase_events")
        .select("id, created_at, user_id, company_id, amount_cents, currency, order_id, metadata")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        console.error("Error cargando compras:", error);
        setPurchases([]);
        setPurchasesError(error.message);
        return;
      }

      setPurchases(((data ?? []) as unknown) as PurchaseRow[]);
    } finally {
      setLoadingPurchases(false);
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

      const { error } = await supabaseBrowser.from("company_profiles").update(payload).eq("id", company.id);

      if (error) {
        console.error("Error guardando empresa:", error);
        alert("No se ha podido guardar. Esto es RLS/policies en Supabase (bloquea UPDATE).");
        return;
      }

      await loadCompany();
      alert("Empresa guardada.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;
        setUser(user);

        await loadCompany();
      } catch (e) {
        console.error("Error init company edit:", e);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  // Cuando ya tenemos company.id, cargamos compras
  useEffect(() => {
    if (!company?.id) return;
    // Solo tiene sentido para owner; si no lo eres, te lo dejamos vacío para evitar confusión
    if (!isOwner) {
      setPurchases([]);
      return;
    }
    loadPurchases(company.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, isOwner]);

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
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-5xl mx-auto px-4 py-8">
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

        {/* PANEL EDIT */}
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

            <div className="min-w-0 flex-1">
              <div className="text-xl font-semibold truncate">{company.display_name ?? company.handle}</div>
              <div className="text-sm text-neutral-400 truncate">@{company.handle}</div>

              <div className="mt-2 text-xs text-neutral-400">
                Verificada:{" "}
                <span className="text-neutral-200">
                  {company.verified ? "Sí" : "No"} ({company.verification_level || "—"})
                </span>{" "}
                · Score: <span className="text-neutral-200">{company.ethq_score ?? 0}</span>
              </div>

              {!isOwner ? (
                <div className="text-xs text-amber-300 mt-2">
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
                disabled={!isOwner}
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Jurisdicción</label>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="Comunidad Valenciana"
                disabled={!isOwner}
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Sector</label>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="Cosmética profesional"
                disabled={!isOwner}
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Tipo</label>
              <input
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="Pyme / Cooperativa"
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Tamaño</label>
              <input
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="1-10"
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="https://.../logo.png"
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                rows={5}
                placeholder="Descripción de la empresa…"
                disabled={!isOwner}
              />
            </div>
          </div>
        </div>

        {/* LOG DE COMPRAS */}
        <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold">Compras recientes</div>
              <div className="text-xs text-neutral-400 mt-1">
                Visible solo para el owner. Muestra las últimas 25 compras notificadas a Ethiqia.
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwner || loadingPurchases}
              onClick={() => company?.id && loadPurchases(company.id)}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500 disabled:opacity-60"
            >
              {loadingPurchases ? "Actualizando…" : "Actualizar"}
            </button>
          </div>

          {!isOwner ? (
            <div className="mt-4 text-sm text-neutral-400">
              Para ver el log de compras, debes ser el owner de esta empresa.
            </div>
          ) : purchasesError ? (
            <div className="mt-4 text-sm text-amber-300">
              No se pudo cargar compras: <span className="text-neutral-200">{purchasesError}</span>
              <div className="mt-2 text-xs text-neutral-500">
                Si esto aparece, es RLS en purchase_events (ejecuta el SQL del paso 1).
              </div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="mt-4 text-sm text-neutral-400">
              Aún no hay compras registradas (o todavía no ha llegado ninguna notificación válida).
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Importe</th>
                    <th className="py-2 pr-3">Order ID</th>
                    <th className="py-2 pr-3">Buyer (user_id)</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-t border-neutral-800">
                      <td className="py-2 pr-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(p.amount_cents, p.currency)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{p.order_id || "—"}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{p.user_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
