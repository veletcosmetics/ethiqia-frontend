"use client";

import React, { useState, useEffect } from "react";

type AccountType = "user" | "company" | "influencer";

interface ProfileFormState {
  accountType: AccountType;
  displayName: string;
  username: string;
  bio: string;
  sector: string;
  location: string;
  website: string;
  isPublic: boolean;
  avatarUrl: string | null; // futuro: URL en storage
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileFormState>({
    accountType: "user",
    displayName: "",
    username: "",
    bio: "",
    sector: "",
    location: "",
    website: "",
    isPublic: true,
    avatarUrl: null,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<null | { type: "ok" | "error"; text: string }>(
    null
  );

  function handleChange<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Manejo de cambio de foto de perfil
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Pequeño filtro básico por tipo
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "El archivo debe ser una imagen (jpg, png, webp...).",
      });
      return;
    }

    // Podríamos limitar tamaño en MB si queremos (solo avisar, no obligatorio)
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMessage({
        type: "error",
        text: `La imagen es demasiado grande. Máximo ${maxSizeMB} MB.`,
      });
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  // Limpieza del objeto URL cuando cambie o se destruya
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Próximo paso: aquí subiremos la imagen a Supabase Storage
      // y guardaremos form + avatarUrl en la base de datos.

      await new Promise((resolve) => setTimeout(resolve, 600)); // demo

      setMessage({
        type: "ok",
        text: "Cambios guardados (demo). Próximo paso: conectar con tu base de datos y storage de imágenes.",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Ha ocurrido un error al guardar. Revisa la consola del navegador.",
      });
    } finally {
      setSaving(false);
    }
  }

  const isCompany = form.accountType === "company";
  const isInfluencer = form.accountType === "influencer";

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Título */}
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Tu perfil en Ethiqia</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Define cómo quieres presentarte: persona, empresa o influencer. Esta será la
            base de tu Ethiqia Score y de tu visibilidad en la plataforma.
          </p>
        </header>

        {/* Estado de guardado */}
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "ok"
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/60 bg-red-500/10 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Layout principal */}
        <div className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto de perfil */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Foto de perfil</h2>
              <p className="text-xs text-gray-400">
                Usa una foto que te represente bien. En empresas, puedes usar el logo.
              </p>

              <div className="flex items-center gap-4">
                {/* Preview círculo */}
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 flex items-center justify-center overflow-hidden text-sm font-bold text-black">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : form.displayName ? (
                    form.displayName.charAt(0).toUpperCase()
                  ) : (
                    "EQ"
                  )}
                </div>

                {/* Input de archivo */}
                <div className="space-y-2 text-xs">
                  <label className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-gray-200 cursor-pointer hover:border-emerald-500 hover:text-emerald-200 transition">
                    <span>Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Formatos recomendados: JPG, PNG, WEBP. Tamaño máx. 5 MB.
                  </p>
                </div>
              </div>
            </section>

            {/* Tipo de cuenta */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Tipo de cuenta</h2>
              <p className="text-xs text-gray-400">
                Puedes empezar como persona y más adelante cambiar a empresa o influencer
                sin perder tu histórico.
              </p>

              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => handleChange("accountType", "user")}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    form.accountType === "user"
                      ? "bg-white text-black border-white"
                      : "border-zinc-700 text-gray-300 hover:border-zinc-500"
                  }`}
                >
                  Persona
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("accountType", "company")}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    form.accountType === "company"
                      ? "bg-white text-black border-white"
                      : "border-zinc-700 text-gray-300 hover:border-zinc-500"
                  }`}
                >
                  Empresa
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("accountType", "influencer")}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    form.accountType === "influencer"
                      ? "bg-white text-black border-white"
                      : "border-zinc-700 text-gray-300 hover:border-zinc-500"
                  }`}
                >
                  Influencer / Creador
                </button>
              </div>
            </section>

            {/* Nombre y usuario */}
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Nombre visible{" "}
                  <span className="text-xs text-gray-500">(lo que verá la gente)</span>
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder={
                    isCompany
                      ? "Ej. VELET Cosmetics"
                      : isInfluencer
                      ? "Ej. LauraFit · Entrenadora"
                      : "Ej. Ana López"
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Usuario @{" "}
                  <span className="text-xs text-gray-500">
                    (único, se usará en tu URL pública)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-gray-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      handleChange(
                        "username",
                        e.target.value.replace(/\s+/g, "").toLowerCase()
                      )
                    }
                    placeholder="tucuenta"
                    className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Más adelante podremos reservar esta URL, ej:{" "}
                  <span className="text-gray-300">
                    ethiqia.com/u/<span className="underline">tucuenta</span>
                  </span>
                </p>
              </div>
            </section>

            {/* Bio */}
            <section className="space-y-2">
              <label className="block text-sm font-medium">
                {isCompany ? "Sobre la empresa" : "Sobre ti"}
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={4}
                placeholder={
                  isCompany
                    ? "Qué hace vuestra empresa, a quién ayudáis, qué os diferencia..."
                    : isInfluencer
                    ? "Qué tipo de contenido creas, en qué plataformas, qué puede esperar la gente de ti..."
                    : "En qué trabajas, qué te interesa, cómo aportas valor..."
                }
                className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-gray-500">
                Esta descripción se mostrará en tu perfil público y puede influir en tu
                Ethiqia Score cuando validemos datos.
              </p>
            </section>

            {/* Sector / localización / web */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Sector / categoría</label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => handleChange("sector", e.target.value)}
                  placeholder={
                    isCompany
                      ? "Ej. Cosmética profesional, Tecnología, Salud..."
                      : isInfluencer
                      ? "Ej. Fitness, Belleza, Gaming..."
                      : "Ej. Marketing, Enfermería, Estética..."
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Ciudad / país</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Ej. Elche, España"
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="block text-sm font-medium">Web o enlace principal</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </section>

            {/* Visibilidad */}
            <section className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => handleChange("isPublic", !form.isPublic)}
                  className={`h-5 w-9 rounded-full border flex items-center px-[2px] transition ${
                    form.isPublic
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-zinc-600 bg-zinc-900"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transform transition ${
                      form.isPublic ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
                Perfil público (beta)
              </label>
              <p className="text-[11px] text-gray-500">
                Si está activado, tu perfil podrá ser visible en exploración y listado de
                cuentas cuando lancemos esa parte de la beta.
              </p>
            </section>

            {/* Botón guardar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>

          {/* Panel lateral de vista previa */}
          <aside className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <h2 className="text-sm font-semibold text-gray-200">
              Vista previa del perfil público
            </h2>

            <div className="space-y-4">
              {/* Cabecera */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 flex items-center justify-center overflow-hidden text-xs font-bold text-black">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : form.displayName ? (
                    form.displayName.charAt(0).toUpperCase()
                  ) : (
                    "EQ"
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {form.displayName || "Nombre visible"}
                  </span>
                  <span className="text-xs text-gray-400">
                    @{form.username || "tucuenta"}
                  </span>
                  <span className="text-[11px] text-emerald-400 mt-1">
                    {form.accountType === "company"
                      ? "Cuenta de empresa"
                      : form.accountType === "influencer"
                      ? "Influencer / creador"
                      : "Cuenta personal"}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <p className="text-xs text-gray-300 whitespace-pre-wrap">
                  {form.bio || "Aquí aparecerá tu descripción pública."}
                </p>
              </div>

              {/* Extra info */}
              <div className="space-y-1 text-[11px] text-gray-400">
                {form.sector && (
                  <p>
                    <span className="text-gray-500">Sector:</span> {form.sector}
                  </p>
                )}
                {form.location && (
                  <p>
                    <span className="text-gray-500">Ubicación:</span> {form.location}
                  </p>
                )}
                {form.website && (
                  <p className="truncate">
                    <span className="text-gray-500">Web:</span>{" "}
                    <span className="text-emerald-400">{form.website}</span>
                  </p>
                )}
              </div>

              {/* Placeholder Ethiqia Score */}
              <div className="mt-2 rounded-xl border border-zinc-800 bg-black/40 px-3 py-2">
                <p className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-200">
                    Ethiqia Score (beta):
                  </span>{" "}
                  pronto mostraremos aquí una puntuación basada en tu actividad, tus
                  datos verificados y el feedback de la comunidad.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
