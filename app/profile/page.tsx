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

// Cliente Supabase para el navegador
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError("Error obteniendo el usuario");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("No hay sesión activa. Inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("Error cargando el perfil");
        setLoading(false);
        return;
      }

      // Si no existe perfil todavía, preparamos uno vacío
      const initialProfile: Profile = data ?? {
        id: user.id,
        full_name: "",
        bio: "",
        avatar_url: null,
      };

      setProfile(initialProfile);
      setFullName(initialProfile.full_name ?? "");
      setBio(initialProfile.bio ?? "");
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: profile.id, // muy importante para que respete las RLS
      full_name: fullName,
      bio,
    });

    if (upsertError) {
      console.error(upsertError);
      setError("Error guardando el perfil");
      setSaving(false);
      return;
    }

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
        <div className="bg-zinc-900 border border-red-500/50 rounded-2xl px-6 py-4 max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-zinc-400 text-sm">
            Si el problema persiste, prueba a cerrar sesión y volver a entrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Mi perfil</h1>
        <p className="text-zinc-400 mb-8">
          Aquí podrás configurar cómo te ve el resto de usuarios en Ethiqia.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Nombre público
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: Ana, abogada, experta en IA..."
            />
            <p className="text-xs text-zinc-500 mt-1">
              Este nombre se mostrará encima de tus publicaciones.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Cuenta en pocas líneas quién eres y por qué usas Ethiqia."
            />
            <p className="text-xs text-zinc-500 mt-1">
              Esto podrá verse en tu perfil y, más adelante, al pasar el ratón
              sobre tu nombre en el feed.
            </p>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end gap-3">
            {saving && (
              <span className="text-xs text-zinc-400 self-center">
                Guardando...
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
