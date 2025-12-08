"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";
import PostCard, { Post } from "@/components/PostCard";

type Profile = {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    bio: "",
    avatar_url: null,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  // 1) Cargar usuario autenticado
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();
        setUser(user ?? null);
      } catch (err) {
        console.error("Error obteniendo usuario:", err);
      } finally {
        setAuthChecked(true);
      }
    };

    initAuth();
  }, []);

  // 2) Cargar perfil y posts cuando tengamos usuario
  useEffect(() => {
    const loadProfileAndPosts = async () => {
      if (!user) {
        setLoadingProfile(false);
        setLoadingPosts(false);
        return;
      }

      setLoadingProfile(true);
      setLoadingPosts(true);
      setMessage(null);

      try {
        // PERFIL
        const { data: profileRow, error: profileError } = await supabaseBrowser
          .from("profiles")
          .select("full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error cargando perfil:", profileError);
        }

        if (profileRow) {
          setProfile({
            full_name: profileRow.full_name,
            bio: profileRow.bio,
            avatar_url: profileRow.avatar_url,
          });
        } else {
          // Si no existe, dejamos valores vacíos
          setProfile({
            full_name: "",
            bio: "",
            avatar_url: null,
          });
        }

        // POSTS DEL USUARIO
        const { data: postsData, error: postsError } = await supabaseBrowser
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error cargando posts del usuario:", postsError);
        } else if (postsData) {
          setPosts(postsData as Post[]);
        }
      } catch (err) {
        console.error("Error cargando perfil/posts:", err);
      } finally {
        setLoadingProfile(false);
        setLoadingPosts(false);
      }
    };

    if (user) {
      loadProfileAndPosts();
    }
  }, [user]);

  // 3) Guardar perfil (nombre + bio)
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setMessage(null);

    try {
      const { error } = await supabaseBrowser
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Error guardando perfil:", error);
        setMessage("No se ha podido guardar el perfil.");
        return;
      }

      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      setMessage("No se ha podido guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 4) Subir avatar
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

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
        throw new Error("Error subiendo avatar");
      }

      const data = await res.json();
      const publicUrl = data.publicUrl as string;

      // Guardamos en perfil
      const { error } = await supabaseBrowser
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: publicUrl,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Error guardando avatar en perfil:", error);
        setMessage("Avatar subido pero no se ha podido guardar en el perfil.");
        return;
      }

      setProfile((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      setMessage("Avatar actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("No se ha podido subir el avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 5) Cerrar sesión
  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    }
  };

  // 6) Calcular Ethiqia Score global del usuario
  const userScore = React.useMemo(() => {
    if (!posts || posts.length === 0) return null;

    const validPosts = posts.filter((p) => !p.blocked);
    if (validPosts.length === 0) return null;

    const sum = validPosts.reduce(
      (acc, p) => acc + (p.global_score ?? 0),
      0
    );
    const avg = sum / validPosts.length;
    return Math.round(avg);
  }, [posts]);

  // Si ya comprobamos auth y no hay usuario
  if (authChecked && !user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Perfil Ethiqia</h1>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para ver tu perfil.
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
        {/* Cabecera perfil */}
        <header className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold">
                {profile.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : "E"}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-semibold">
              {profile.full_name || "Usuario Ethiqia"}
            </h1>
            <p className="text-sm text-gray-400">
              {profile.bio || "Cuenta verificada en Ethiqia."}
            </p>
            {userScore !== null && (
              <p className="text-sm text-emerald-400">
                Ethiqia Score global:{" "}
                <span className="font-semibold">{userScore}/100</span>
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-xs rounded-full border border-neutral-700 px-3 py-1 hover:bg-neutral-900"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Formulario de edición de perfil */}
        <section className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Editar perfil</h2>

          {loadingProfile ? (
            <p className="text-sm text-gray-400">Cargando perfil…</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre completo</label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={profile.full_name ?? ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                  value={profile.bio ?? ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-sm"
                  />
                  {uploadingAvatar && (
                    <span className="text-xs text-gray-400">
                      Subiendo avatar…
                    </span>
                  )}
                </div>
              </div>

              {message && (
                <p className="text-sm text-emerald-400 whitespace-pre-line">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {savingProfile ? "Guardando…" : "Guardar cambios"}
              </button>
            </form>
          )}
        </section>

        {/* Publicaciones del usuario */}
        <section className="space-y-4 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tus publicaciones</h2>
            {loadingPosts && (
              <span className="text-xs text-gray-400">
                Cargando publicaciones…
              </span>
            )}
          </div>

          {!loadingPosts && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no has publicado nada. Sube tu primera foto auténtica
              desde el feed.
            </p>
          )}

          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorName={profile.full_name || "Usuario Ethiqia"}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
