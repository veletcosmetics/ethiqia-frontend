"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

const SECTORS = ["Cosmetica", "Restauracion", "Tecnologia", "Salud", "Educacion", "Comercio", "Otro"];

function EthiqiaIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M50 5L93.3 27.5V72.5L50 95L6.7 72.5V27.5L50 5Z" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="4"/>
      <circle cx="50" cy="32" r="6" fill="#10b981"/><circle cx="30" cy="68" r="6" fill="#10b981"/><circle cx="70" cy="68" r="6" fill="#10b981"/>
      <line x1="50" y1="32" x2="30" y2="68" stroke="#10b981" strokeWidth="3"/><line x1="50" y1="32" x2="70" y2="68" stroke="#10b981" strokeWidth="3"/><line x1="30" y1="68" x2="70" y2="68" stroke="#10b981" strokeWidth="3"/>
    </svg>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full max-w-md mx-auto flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-emerald-500" : "bg-neutral-800"}`} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Step 2
  const [userType, setUserType] = useState<"user" | "company" | null>(null);

  // Step 3
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 4
  const [postText, setPostText] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabaseBrowser.auth.getUser();
        if (!user) { router.push("/login"); return; }
        if (!user.email_confirmed_at) { router.push("/confirm-email"); return; }
        setUserId(user.id);

        const { data: session } = await supabaseBrowser.auth.getSession();
        setToken(session.session?.access_token ?? null);

        // Check if onboarding already completed
        const { data: profile } = await supabaseBrowser
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          router.push("/feed");
          return;
        }
      } catch { router.push("/login"); }
      finally { setLoading(false); }
    };
    init();
  }, [router]);

  const saveProfile = async (fields: Record<string, any>) => {
    if (!userId) return;
    await supabaseBrowser.from("profiles").update(fields).eq("id", userId);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !token) return null;
    try {
      const formData = new FormData();
      formData.append("file", avatarFile);
      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        const publicUrl = json.publicUrl ?? json.url;
        if (publicUrl) {
          const { error } = await supabaseBrowser.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
          if (error) console.error("Error saving avatar_url:", error);
          return publicUrl;
        }
      } else {
        console.error("Upload avatar failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Upload avatar error:", err);
    }
    return null;
  };

  const handleStep2 = async (type: "user" | "company") => {
    setUserType(type);
    await saveProfile({ user_type: type });
    setStep(3);
  };

  const handleStep3 = async () => {
    setSaving(true);
    try {
      await uploadAvatar();
      const updates: Record<string, any> = {};
      if (fullName.trim()) updates.full_name = fullName.trim();
      if (userType === "company" && companyName.trim()) updates.company_name = companyName.trim();
      if (userType === "company" && sector) updates.sector = sector;
      if (Object.keys(updates).length > 0) await saveProfile(updates);
    } catch { /* no-op */ }
    finally { setSaving(false); }
    setStep(4);
  };

  const handleStep4Publish = async () => {
    if (!postText.trim() || !token) { setStep(5); return; }
    setPublishing(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: postText, aiProbability: 0, globalScore: 100, blocked: false, repostOf: null, imageUrl: null }),
      });
    } catch { /* no-op */ }
    finally { setPublishing(false); }
    setStep(5);
  };

  const handleFinish = async () => {
    await saveProfile({ onboarding_completed: true });
    router.push("/feed");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress */}
      <div className="px-4 pt-6 pb-2">
        <ProgressBar step={step} total={5} />
        <p className="text-center text-[11px] text-neutral-600 mt-2">Paso {step} de 5</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        {/* STEP 1 — Bienvenida */}
        {step === 1 && (
          <div className="text-center max-w-md space-y-6">
            <EthiqiaIcon />
            <div>
              <h1 className="text-3xl font-bold">Bienvenido a Ethiqia</h1>
              <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
                La red social donde empresas y personas demuestran que actuan bien.
              </p>
            </div>
            <button onClick={() => setStep(2)} className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-10 py-3 text-sm font-semibold transition-colors">
              Empezar →
            </button>
          </div>
        )}

        {/* STEP 2 — Tipo */}
        {step === 2 && (
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Eres empresa o persona?</h2>
              <p className="text-sm text-neutral-400 mt-2">Elige como quieres usar Ethiqia</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleStep2("company")}
                className={`p-6 rounded-2xl border text-left transition-all ${userType === "company" ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"}`}
              >
                <div className="text-2xl mb-3">&#127970;</div>
                <p className="text-sm font-semibold">Empresa verificada</p>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">Quiero verificar mi negocio y obtener el badge de empresa verificada</p>
              </button>
              <button
                type="button"
                onClick={() => handleStep2("user")}
                className={`p-6 rounded-2xl border text-left transition-all ${userType === "user" ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"}`}
              >
                <div className="text-2xl mb-3">&#128100;</div>
                <p className="text-sm font-semibold">Usuario</p>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">Quiero una red social sin odio, con IA que modera el contenido</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Perfil basico */}
        {step === 3 && (
          <div className="max-w-md w-full space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Tu perfil</h2>
              <p className="text-sm text-neutral-400 mt-2">Informacion basica para empezar</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <label className="relative h-20 w-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center cursor-pointer overflow-hidden group">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-neutral-500 text-xs">Foto</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] text-white">Cambiar</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Nombre completo</label>
              <input className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
            </div>

            {userType === "company" && (
              <>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Nombre de empresa</label>
                  <input className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nombre comercial" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Sector</label>
                  <select className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" value={sector} onChange={(e) => setSector(e.target.value)}>
                    <option value="">Selecciona sector</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(4)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                Saltar por ahora
              </button>
              <button type="button" onClick={handleStep3} disabled={saving} className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Primera accion */}
        {step === 4 && (
          <div className="max-w-md w-full space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{userType === "company" ? "Tu primera accion" : "Tu primer post"}</h2>
              <p className="text-sm text-neutral-400 mt-2">
                {userType === "company"
                  ? "Sube tu primera certificacion o vincula una herramienta"
                  : "Cuentanos algo que haces de forma sostenible o etica"}
              </p>
            </div>

            {userType === "company" ? (
              <div className="space-y-3">
                <button type="button" onClick={() => { saveProfile({ onboarding_completed: true }); router.push("/company"); }} className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 p-5 text-left transition-colors">
                  <p className="text-sm font-semibold">Ir a mi perfil de empresa</p>
                  <p className="text-xs text-neutral-400 mt-1">Vincula herramientas, sube documentos y empieza a verificar tu actividad</p>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  rows={4}
                  placeholder="Ej: Hoy he ido al trabajo en bici, compro cosmetica vegana, reciclo en casa..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <button type="button" onClick={handleStep4Publish} disabled={publishing} className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors">
                  {publishing ? "Publicando..." : postText.trim() ? "Publicar y continuar" : "Continuar sin publicar"}
                </button>
              </div>
            )}

            <button type="button" onClick={() => setStep(5)} className="block mx-auto text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
              Saltar por ahora
            </button>
          </div>
        )}

        {/* STEP 5 — Listo */}
        {step === 5 && (
          <div className="text-center max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
              <svg className="h-10 w-10 text-emerald-400" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ya formas parte de Ethiqia!</h2>
              <p className="text-sm text-neutral-400 mt-3">Tu Ethiqia Score: <span className="text-emerald-400 font-semibold">0</span> · Empieza a crecer</p>
            </div>
            <button onClick={handleFinish} className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-10 py-3 text-sm font-semibold transition-colors">
              Ver el feed →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
