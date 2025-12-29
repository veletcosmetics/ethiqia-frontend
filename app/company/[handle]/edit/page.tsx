"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type CompanyRow = {
  id: string;
  owner_user_id: string;
  handle: string;
  display_name: string | null;
  website: string | null;
  bio: string | null;
  location: string | null;
  logo_url: string | null;
  created_at?: string | null;
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

  // campos editables
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
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
        .select("id, owner_user_id, handle, display_name, website, bio, location, logo_url, created_at")
        .eq("handle", handle)
        .maybeSingle();

      if (error) {
        console.error("Error cargando empresa:", error);
        setCompany(null);
        return;
      }

      const row = (data as CompanyRow) ?? null;
      setCompany(row);

      setDisplayName(row?.display_name ?? "");
      setWebsite(row?.website ?? "");
      setLocation(row?.location ?? "");
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
        id: company.id,
        display_name: displayName.trim() || null,
        website: website.trim() ? normalizeUrl(website) : null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        logo_url: logoUrl.trim() ? normalizeUrl(logoUrl) : null,
      };

      const { error } = await supabaseBrowser.from("company_profiles").update(payload).eq("id", company.id);

      if (error) {
        console.error("Error guardando empresa:", error);
        alert("No se ha podido guardar. Si ves RLS/policy, hay que ajustar policies en Supabase.");
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
                <span className="text-xl font-semibold">{(company.display_name?.[0] || "E").toUpperCase()}</span>
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
              <label className="text-xs text-neutral-400 block mb-1">Web</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="https://..."
                disabled={!isOwner}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-400 block mb-1">Ubicación</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                placeholder="España"
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

          {/* Nota sobre integraciones/apps */}
          <div className="mt-6 text-xs text-neutral-500">
            Integraciones (Canva/Stripe/contabilidad): las añadimos en el siguiente paso con tabla/columna dedicada.
            Aquí solo estamos desbloqueando el panel y el público para eliminar los 404.
          </div>
        </div>
      </section>
    </main>
  );
}
