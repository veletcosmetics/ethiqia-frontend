"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [globalScore, setGlobalScore] = useState<number | null>(null);

  // Cargar usuario + perfil + score
  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(user);

        // 1) Perfil
        const { data: profileData, error: profileError } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          // PGRST116 = no rows
          console.error("Error cargando perfil:", profileError);
        }

        if (profileData) {
          setProfile(profileData as Profile);
        } else {
          // Si no existe perfil, lo creamos
          const { data: newProfile, error: insertError } =
            await supabaseBrowser
              .from("profiles")
              .insert({ id: user.id })
              .select("id, full_name, bio, avatar_url")
              .single();

          if (insertError) {
            console.error("Error creando perfil:", insertError);
          } else if (newProfile) {
            setProfile(newProfile as Profile);
          }
        }

        // 2) Score global a partir de posts no bloqueados
        const { data: posts, error: postsError } = await supabaseBrowser
          .from("posts")
          .select("global_score, blocked")
          .eq("user_id", user.id)
          .eq("blocked", false);

        if (postsError) {
          console.error("Error cargando posts para score:", postsError);
        } else if (posts && posts.length > 0) {
          const validScores = posts
            .map((p: any) => p.global_score)
            .filter((v: any) => typeof v === "number");

          if (validScores.length > 0) {
            const sum = validScores.reduce((acc: number, v: number) => acc + v, 0);
            setGlobalScore(Math.round(sum / validScores.length));
          }
        }
      } catch (error) {
        console.error("Error cargando perfil/score:", error);
        setMessage("No se ha podido cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleProfileChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          // MUY IMPORTANTE: mantenemos avatar_url tal cual esté
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id)
        .select("id, full_name, bio, avatar_url")
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
      }

      setMessage("Perfil guardado correctamente.");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      setMessage("No se ha podido guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || !profile) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setMessage(null);

    try {
      // 1) Subir archivo a /api/upload (misma lógica que el feed)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error subiendo el avatar");
      }

      const { publicUrl } = await res.json();

      if (!publicUrl) {
        throw new Error("La API de subida no devolvió URL pública");
      }

      // 2) Guardar en la tabla profiles
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id, full_name, bio, avatar_url")
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
      } else {
        // fallback: actualizar solo en memoria
        setProfile({ ...profile, avatar_url: publicUrl });
      }

      setMessage("Avatar actualizado correctamente.");
    } catch (error) {
      console.error("Error subiendo avatar:", error);
      setMessage("No se ha podido subir el avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando perfil...</p>
      </main>
    );
  }

  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para ver y editar tu perfil.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold"
          >
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );
  }

  const initialLetter =
    profile.full_name?.trim()?.charAt(0)?.toUpperCase() ??
    user.email?.charAt(0)?.toUpperCase() ??
    "E";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera con avatar + nombre + bio + score */}
        <header className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border border-neutral-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-semibold">
              {initialLetter}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold">
              {profile.full_name || user.email}
            </h1>
            <p className="text-sm text-gray-400">
              {profile.bio || "Aún no has escrito tu bio."}
            </p>
            {globalScore !== null && (
              <p className="mt-2 text-sm text-emerald-400">
                Ethiqia Score global: {globalScore}/100
              </p>
            )}
          </div>
        </header>

        {message && (
          <p className="text-sm text-emerald-400 whitespace-pre-line">{message}</p>
        )}

        {/* Formulario de edición */}
        <section className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Editar perfil</h2>

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="space-y-1">
              <label className="text-sm text-gray-300">Nombre completo</label>
              <input
                name="full_name"
                type="text"
                value={profile.full_name ?? ""}
                onChange={handleProfileChange}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={profile.bio ?? ""}
                onChange={handleProfileChange}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Foto de perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
                className="text-sm"
              />
              {avatarUploading && (
                <p className="text-xs text-gray-400 mt-1">Subiendo avatar...</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
