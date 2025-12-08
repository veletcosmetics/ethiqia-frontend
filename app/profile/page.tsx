"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type Profile = {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 1) Cargar usuario actual
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabaseBrowser.auth.getUser();
        const user = data.user ?? null;
        setCurrentUser(user);

        if (!user) {
          setLoadingProfile(false);
          return;
        }

        // 2) Cargar perfil
        const { data: profileData, error: profileError } = await supabaseBrowser
          .from("profiles")
          .select("full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error cargando perfil:", profileError);
          setProfile({
            full_name: null,
            bio: null,
            avatar_url: null,
          });
        } else {
          setProfile({
            full_name: profileData?.full_name ?? null,
            bio: profileData?.bio ?? null,
            avatar_url: profileData?.avatar_url ?? null,
          });
        }
      } catch (err) {
        console.error("Error obteniendo usuario/perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUser();
  }, []);

  // 3) Cargar posts del usuario para su perfil
  useEffect(() => {
    const loadPosts = async () => {
      if (!currentUser) return;

      setLoadingPosts(true);
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Error al cargar publicaciones");
        }
        const data = await res.json();
        const allPosts: Post[] = data.posts ?? [];

        // Filtramos solo las publicaciones de este usuario
        const myPosts = allPosts.filter(
          (p) => (p as any).user_id === currentUser.id
        );
        setPosts(myPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (currentUser) {
      loadPosts();
    }
  }, [currentUser]);

  // 4) Calcular un Ethiqia Score simple a partir de los posts
  const computedScore = (() => {
    if (!posts.length) return null;

    const sum = posts.reduce((acc, post) => {
      const val = (post as any).global_score;
      return acc + (typeof val === "number" ? val : 0);
    }, 0);

    const avg = sum / posts.length;
    return Math.round(Math.max(0, Math.min(100, avg)));
  })();

  // 5) Guardar cambios de nombre + bio
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentUser || !profile) return;

    setSavingProfile(true);
    try {
      const { error } = await supabaseBrowser
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
        })
        .eq("id", currentUser.id);

      if (error) {
        console.error("Error actualizando perfil:", error);
        setMessage("Error al guardar el perfil.");
      } else {
        setMessage("Perfil actualizado correctamente.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error al guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 6) Subir avatar usando la misma API de upload
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingAvatar(true);
    setMessage(null);

    try {
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
      const avatarUrl: string = publicUrl;

      const { error } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", currentUser.id);

      if (error) {
        console.error("Error guardando avatar_url en perfil:", error);
        setMessage("Error al guardar el avatar.");
      } else {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: avatarUrl } : prev
        );
        setMessage("Avatar actualizado correctamente.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error al subir el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando perfil...</p>
      </main>
    );
  }

  if (!currentUser) {
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

  const displayName =
    profile?.full_name ||
    currentUser.user_metadata?.name ||
    currentUser.email ||
    "Usuario Ethiqia";

  const initialLetter =
    displayName && displayName.length > 0
      ? displayName.charAt(0).toUpperCase()
      : "E";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* CABECERA PERFIL */}
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border border-neutral-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl font-semibold">
                {initialLetter}
              </div>
            )}

            <label className="mt-2 block text-xs text-emerald-400 cursor-pointer">
              {uploadingAvatar ? "Subiendo..." : "Cambiar foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>
          </div>

          {/* Datos básicos + score */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              {profile?.bio && (
                <p className="text-sm text-gray-300 mt-1">{profile.bio}</p>
              )}
            </div>

            {/* Bloque Ethiqia Score */}
            <div className="inline-flex items-center gap-3 rounded-xl border border-emerald-600/60 bg-emerald-900/10 px-4 py-2">
              <div className="text-sm text-gray-300">
                Ethiqia Score{" "}
                <span className="text-xs text-gray-500">(beta)</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {computedScore !== null ? `${computedScore}/100` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO EDICIÓN PERFIL */}
        <section className="bg-neutral-900 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Editar perfil</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={profile?.full_name ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, full_name: e.target.value } : prev
                  )
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={profile?.bio ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, bio: e.target.value } : prev
                  )
                }
              />
            </div>

            {message && (
              <p className="text-xs text-emerald-400 whitespace-pre-line">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>

        {/* TUS PUBLICACIONES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tus publicaciones</h2>
            <a
              href="/feed"
              className="text-xs text-emerald-400 hover:underline"
            >
              Ir al feed
            </a>
          </div>

          {loadingPosts && (
            <p className="text-sm text-gray-400">
              Cargando tus publicaciones...
            </p>
          )}

          {!loadingPosts && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Aún no has publicado nada. Sube tu primera foto auténtica desde el
              feed.
            </p>
          )}

          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorName={displayName}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
