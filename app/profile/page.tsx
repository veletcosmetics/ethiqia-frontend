"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  // 1) Cargar usuario + perfil
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();
        if (!user) {
          setUser(null);
          return;
        }
        setUser(user);

        const { data, error } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error cargando perfil:", error);
          return;
        }

        const p = data as Profile;
        setProfile(p);
        setFullName(p.full_name ?? "");
        setBio(p.bio ?? "");
      } catch (err) {
        console.error("Error inicializando perfil:", err);
      }
    };

    loadUserAndProfile();
  }, []);

  // 2) Guardar nombre + bio
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileMessage(null);
    setSavingProfile(true);

    try {
      const { error } = await supabaseBrowser
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error actualizando perfil:", error);
        setProfileMessage("Error al guardar tu perfil.");
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: fullName.trim() || null,
              bio: bio.trim() || null,
            }
          : prev
      );
      setProfileMessage("Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setProfileMessage("Error al guardar tu perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 3) Subir avatar y guardar avatar_url
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarMessage(null);
    setAvatarUploading(true);

    try {
      // reutilizamos /api/upload (misma que el feed)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Error HTTP al subir avatar:", res.status);
        setAvatarMessage("Error al subir la foto de perfil.");
        return;
      }

      // IMPORTANTE: /api/upload devuelve { url, path }
      const { url } = await res.json();
      if (!url) {
        setAvatarMessage("No se recibió la URL pública del avatar.");
        return;
      }

      // guardamos en la tabla profiles
      const { error } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (error) {
        console.error("Error guardando avatar_url en profiles:", error);
        setAvatarMessage("Error al guardar la foto de perfil.");
        return;
      }

      // actualizamos estado local para que se vea al momento
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: url,
            }
          : prev
      );

      setAvatarMessage("Foto de perfil actualizada correctamente.");
    } catch (err) {
      console.error(err);
      setAvatarMessage("Error al subir la foto de perfil.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  if (!user) {
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

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <header className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-xl font-semibold">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {profile?.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : "U"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {profile?.full_name || "Mi perfil"}
            </h1>
            <p className="text-sm text-gray-400">
              Aquí puedes configurar tu información pública en Ethiqia.
            </p>
          </div>
        </header>

        {/* Avatar */}
        <section className="bg-neutral-900 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold mb-2">Foto de perfil</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="text-sm"
          />
          {avatarUploading && (
            <p className="text-xs text-gray-400">Subiendo imagen…</p>
          )}
          {avatarMessage && (
            <p className="text-xs text-emerald-400">{avatarMessage}</p>
          )}
        </section>

        {/* Datos básicos */}
        <section className="bg-neutral-900 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Datos básicos</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nombre público</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {profileMessage && (
              <p className="text-xs text-emerald-400">{profileMessage}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
