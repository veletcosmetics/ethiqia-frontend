"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import crypto from "crypto";

const SECTORS = ["Cosmetica", "Restauracion", "Tecnologia", "Salud", "Educacion", "Comercio", "Moda", "Alimentacion", "Energia", "Otro"];

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50);
}

function validateCIF(cif: string): boolean {
  return /^[A-Z][0-9]{7}[A-Z0-9]$/i.test(cif.trim());
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdHandle, setCreatedHandle] = useState<string | null>(null);

  // Step 1 form
  const [form, setForm] = useState({
    name: "", cif: "", sector: "", website: "", email: "", country: "Espana", city: "", bio: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2 domain verification
  const [verifyToken, setVerifyToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    };
    init();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateCompany = async () => {
    setError(null);
    if (!form.name.trim()) { setError("El nombre comercial es obligatorio"); return; }
    if (!form.cif.trim() || !validateCIF(form.cif)) { setError("CIF/NIF invalido. Formato: B12345678"); return; }
    if (!userId) return;

    setSaving(true);
    try {
      const handle = slugify(form.name);
      const token = `ethiqia-verify=${handle}_${Math.random().toString(36).slice(2, 10)}`;
      setVerifyToken(token);

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const { data: session } = await supabaseBrowser.auth.getSession();
        const authToken = session.session?.access_token;
        const res = await fetch("/api/upload-avatar", {
          method: "POST",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          logoUrl = json.publicUrl ?? json.url ?? null;
        }
      }

      // Insert company
      const { error: insertErr } = await supabaseBrowser.from("company_profiles").insert({
        handle,
        display_name: form.name.trim(),
        owner_user_id: userId,
        cif: form.cif.trim().toUpperCase(),
        sector: form.sector || null,
        website: form.website.trim() || null,
        contact_email: form.email.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        bio: form.bio.trim().slice(0, 300) || null,
        logo_url: logoUrl,
        domain_verification_token: token,
        ethq_score: 0,
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          setError("Ya existe una empresa con ese nombre. Prueba con otro.");
        } else {
          setError(insertErr.message);
        }
        return;
      }

      setCreatedHandle(handle);

      // If website provided, go to step 2 (domain verify)
      if (form.website.trim()) {
        setStep(2);
      } else {
        router.push(`/company/${handle}`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error creando empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!createdHandle) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch("/api/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ handle: createdHandle }),
      });
      const json = await res.json();
      setVerifyResult({ verified: json.verified ?? false, message: json.message ?? json.error ?? "" });
    } catch {
      setVerifyResult({ verified: false, message: "Error de conexion" });
    } finally {
      setVerifying(false);
    }
  };

  const inputCls = "w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500";

  if (!userId) return null;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <Link href="/" className="text-xs text-neutral-500 hover:text-emerald-400 transition-colors">← Inicio</Link>

        {/* STEP 1 — Datos basicos */}
        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Registra tu empresa</h1>
              <p className="text-sm text-neutral-400">Completa los datos para crear el perfil de empresa en Ethiqia</p>
            </div>

            <div className="space-y-4">
              {/* Logo */}
              <div className="flex justify-center">
                <label className="w-20 h-20 rounded-lg bg-white flex items-center justify-center cursor-pointer overflow-hidden group border-2 border-dashed border-neutral-700 hover:border-emerald-500 transition-colors">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-neutral-500 text-center leading-tight">Logo<br/>(opcional)</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Nombre comercial *</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Velet Cosmetics" />
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">CIF/NIF *</label>
                <input className={inputCls} value={form.cif} onChange={(e) => setForm(f => ({ ...f, cif: e.target.value.toUpperCase() }))} placeholder="B12345678" maxLength={9} />
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Sector</label>
                <select className={inputCls} value={form.sector} onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))}>
                  <option value="">Selecciona sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Pais</label>
                  <input className={inputCls} value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Ciudad</label>
                  <input className={inputCls} value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ej: Madrid" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Web oficial</label>
                <input className={inputCls} value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} placeholder="tuempresa.com" />
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Email de contacto</label>
                <input className={inputCls} value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Descripcion <span className="text-neutral-600">(max 300 chars)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={300} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Describe brevemente tu empresa..." />
                <p className="text-[10px] text-neutral-600 mt-1 text-right">{form.bio.length}/300</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-900/30 px-4 py-2 text-xs text-red-300">{error}</div>
              )}

              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={saving}
                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Creando empresa..." : "Crear empresa"}
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — Verificacion dominio */}
        {step === 2 && createdHandle && (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Verifica tu dominio</h1>
              <p className="text-sm text-neutral-400">Obtén el badge de dominio verificado</p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
              <div className="space-y-3 text-sm text-neutral-300">
                <p className="font-semibold text-white">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-400 leading-relaxed">
                  <li>Entra en el panel de tu proveedor de dominio (GoDaddy, Namecheap, Ionos, etc.)</li>
                  <li>Ve a la configuracion DNS de tu dominio</li>
                  <li>Anade un nuevo registro TXT con estos datos:</li>
                </ol>

                <div className="rounded-lg bg-black border border-neutral-700 p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-neutral-500">Tipo:</span><span className="text-white">TXT</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Host/Nombre:</span><span className="text-white">@</span></div>
                  <div className="flex justify-between gap-4"><span className="text-neutral-500 shrink-0">Valor:</span><span className="text-emerald-400 font-mono break-all">{verifyToken}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">TTL:</span><span className="text-white">Automatico</span></div>
                </div>

                <p className="text-[11px] text-neutral-500">La propagacion DNS puede tardar hasta 24 horas.</p>
              </div>

              {verifyResult && (
                <div className={`rounded-lg px-4 py-2 text-xs ${verifyResult.verified ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border border-amber-500/20 text-amber-300"}`}>
                  {verifyResult.verified ? "✅ " : "⏳ "}{verifyResult.message}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleVerifyDomain}
                  disabled={verifying}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {verifying ? "Verificando..." : "Verificar ahora"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/company/${createdHandle}`)}
                  className="w-full text-center text-xs text-neutral-500 hover:text-white py-2 transition-colors"
                >
                  Verificar mas tarde →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
