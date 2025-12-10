"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type Profile = {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type UserScore = {
  total_score: number | null;
  transparency: number | null;
  positive_behavior: number | null;
  internal_reputation: number | null;
  external_reputation: number | null;
};

const MAX_TRANSPARENCY = 35;
const MAX_POSITIVE_BEHAVIOR = 25;
const MAX_INTERNAL_REPUTATION = 20;
const MAX_EXTERNAL_REPUTATION = 20;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [score, setScore] = useState<UserScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  // 1) Obtener usuario autenticado
  useEffect(() => {
    const loadUser = async () => {
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
    loadUser();
  }, []);

  // 2) Cargar perfil, score y posts cuando tengamos usuario
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabaseBrowser
          .from("profiles")
          .select("full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error cargando perfil:", error);
          return;
        }

        setProfile({
          full_name: data.full_name ?? null,
          bio: data.bio ?? null,
          avatar_url: data.avatar_url ?? null,
        });
      } catch (err) {
        console.error("Error inesperado cargando perfil:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    const loadScore = async () => {
      setScoreLoading(true);
      try {
        const { data, error } = await supabaseBrowser.rpc("get_user_score", {
          user_id: user.id,
        });

        if (error) {
          console.error("Error obteniendo score:", error);
          setScore(null);
          return;
        }

        const row = (Array.isArray(data) ? data[0] : data) as any;

        if (!row) {
          setScore(null);
          return;
        }

        setScore({
          total_score: row.total_score ?? null,
          transparency: row.transparency ?? null,
          positive_behavior: row.positive_behavior ?? null,
          internal_reputation: row.internal_reputation ?? null,
          external_reputation: row.external_reputation ?? null,
        });
      } catch (err) {
        console.error("Error inesperado obteniendo score:", err);
        setScore(null);
      } finally {
        setScoreLoading(false);
      }
    };

    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const { data, error } = await supabaseBrowser
          .from("posts")
          .select(
            "id, user_id, image_url, caption, created_at, ai_probability, global_score, text, blocked, reason"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error cargando posts del perfil:", error);
          setPosts([]);
          return;
        }

        setPosts((data ?? []) as Post[]);
      } catch (err) {
        console.error("Error inesperado cargando posts del perfil:", err);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    loadProfile();
    loadScore();
    loadPosts();
  }, [user]);

  // 3) Subida de avatar (usa el endpoint que ya tienes hecho)
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    setAvatarMessage(null);

    if (!user) {
      setAvatarMessage("Debes iniciar sesión para cambiar tu imagen.");
      return;
    }

    if (!file) {
      return;
    }

    try {
      setAvatarUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      // IMPORTANTE: mantenemos la misma ruta que ya tenías para no romper nada
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Error HTTP al subir avatar:", res.status);
        setAvatarMessage("No se ha podido subir la imagen de perfil.");
        return;
      }

      const data = await res.json();
      if (!data?.publicUrl) {
        setAvatarMessage("No se recibió la URL pública del avatar.");
        return;
      }

      // Actualizamos en pantalla
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: data.publicUrl as string,
            }
          : prev
      );

      setAvatarMessage("Imagen de perfil actualizada correctamente.");
    } catch (err) {
      console.error("Error inesperado subiendo avatar:", err);
      setAvatarMessage("Ha ocurrido un error al subir tu imagen de perfil.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // 4) Render si no hay sesión
  if (authChecked && !user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
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

  const displayName =
    profile?.full_name ||
    user?.email ||
    (user ? "Usuario Ethiqia" : "Invitado");

  // Helpers para las barras del score
  const renderScoreBar = (
    label: string,
    value: number | null | undefined,
    max: number
  ) => {
    const safeValue = value ?? 0;
    const pct = Math.max(0, Math.min(100, (safeValue / max) * 100));

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{label}</span>
          <span>
            {safeValue}/{max}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* CABECERA PERFIL */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-neutral-900 overflow-hidden flex items-center justify-center border border-neutral-700">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Input para cambiar avatar */}
            <label className="text-xs text-gray-400 cursor-pointer">
              Cambiar foto de perfil
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
            {avatarMessage && (
              <p className="text-xs text-emerald-400 text-center whitespace-pre-line">
                {avatarMessage}
              </p>
            )}
          </div>

          {/* Datos básicos + bio */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              {profileLoading ? (
                <p className="text-xs text-gray-500 mt-1">
                  Cargando información de perfil...
                </p>
              ) : (
                profile?.bio && (
                  <p className="text-sm text-gray-300 mt-1">{profile.bio}</p>
                )
              )}
            </div>

            {/* Estadísticas rápidas (placeholder por ahora) */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <div>
                <span className="font-semibold text-white">
                  {posts.length}
                </span>{" "}
                publicaciones
              </div>
              <div>
                <span className="font-semibold text-white">0</span>{" "}
                seguidores
              </div>
              <div>
                <span className="font-semibold text-white">0</span>{" "}
                siguiendo
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE SCORE ETIQIA */}
        <section className="bg-neutral-900 rounded-xl p-6 space-y-4 border border-neutral-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Score Etiqia</h2>
              <p className="text-xs text-gray-400">
                Versión inicial de tu puntuación. Se irá refinando con tu
                actividad y las integraciones externas.
              </p>
            </div>
            <div className="text-right">
              {scoreLoading ? (
                <p className="text-xs text-gray-500">Calculando...</p>
              ) : score?.total_score != null ? (
                <div>
                  <p className="text-3xl font-bold">
                    {score.total_score}
                    <span className="text-base text-gray-400">/100</span>
                  </p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Puntuación actual
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold">Sin datos aún</p>
                  <p className="text-[11px] text-gray-400">
                    Empieza a publicar contenido auténtico para generar tu
                    Score.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {renderScoreBar(
              "Transparencia",
              score?.transparency,
              MAX_TRANSPARENCY
            )}
            {renderScoreBar(
              "Conducta y actividad positiva",
              score?.positive_behavior,
              MAX_POSITIVE_BEHAVIOR
            )}
            {renderScoreBar(
              "Reputación interna",
              score?.internal_reputation,
              MAX_INTERNAL_REPUTATION
            )}
            {renderScoreBar(
              "Reputación externa verificada",
              score?.external_reputation,
              MAX_EXTERNAL_REPUTATION
            )}
          </div>

          <p className="text-[11px] text-gray-500">
            Nota: La reputación externa (compras verificadas, eventos,
            integraciones con empresas como Velet, etc.) se activará a medida
            que integremos más fuentes de datos reales.
          </p>
        </section>

        {/* PUBLICACIONES DEL USUARIO */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Tus publicaciones</h2>

          {postsLoading && (
            <p className="text-sm text-gray-400">
              Cargando tus publicaciones...
            </p>
          )}

          {!postsLoading && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no has publicado contenido. Sube una foto auténtica desde
              el feed para empezar a construir tu Score.
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
