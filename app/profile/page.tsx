"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente Supabase en el navegador
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Cargar perfil al entrar
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error obteniendo usuario:", userError);
        setError("No se ha podido obtener el usuario. Inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("No hay sesión activa. Vuelve a iniciar sesión.");
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error cargando perfil:", profileError);
        setError("No se ha podido cargar el perfil.");
        setLoading(false);
        return;
      }

      const current: Profile =
        data ??
        ({
          id: user.id,
          full_name: user.email,
          bio: null,
          avatar_url: null,
        } as Profile);

      setProfile(current);
      setFullName(current.full_name ?? "");
      setBio(current.bio ?? "");
      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Sesión no válida. Vuelve a iniciar sesión.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id, // importante para cumplir RLS
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
      },
      {
        onConflict: "id",
      }
    );

    if (upsertError) {
      console.error("Error guardando perfil:", upsertError);
      setError("No se ha podido guardar el perfil.");
      setSaving(false);
      return;
    }

    setMessage("Perfil guardado correctamente.");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="bg-zinc-900 border border-red-500/40 rounded-2xl px-6 py-4 max-w-md text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <p className="text-zinc-400 text-xs">
            Si el problema continúa, prueba a cerrar sesión y volver a entrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Mi perfil</h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Configura cómo quieres aparecer en Ethiqia. Estos datos se usarán en
          el feed y en futuras funciones de reputación.
        </p>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-500/50 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Nombre público */}
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              Nombre público
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: David G. · Emprendedor · IA + ética"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Este nombre se mostrará encima de tus publicaciones.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Cuenta en pocas líneas quién eres y por qué estás en Ethiqia."
            />
            <p className="text-xs text-zinc-500 mt-1">
              Esto se mostrará en tu perfil y podremos usarlo en futuras
              métricas de reputación.
            </p>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
