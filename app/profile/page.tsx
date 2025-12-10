// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type UserScore = {
  transparency_score: number;
  positive_behavior_score: number;
  internal_reputation_score: number;
  external_reputation_score: number;
  total_score: number;
};

type PostCount = {
  count: number;
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [score, setScore] = useState<UserScore | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 1) Cargar usuario, perfil, score, nº de publicaciones
  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        // Perfil
        const { data: profileData } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }

        // Score (de momento asumo que tienes una vista o función;
        // aquí lo dejo como placeholder estático si falla)
        const { data: scoreData, error: scoreError } =
          await supabaseBrowser.rpc("calculate_user_score", {
            p_user_id: user.id,
          });

        if (!scoreError && scoreData) {
          // scoreData debe tener las columnas que definimos en BD
          setScore(scoreData as UserScore);
        } else {
          // Fallback por si aún no está conectada la función
          setScore({
            transparency_score: 25,
            positive_behavior_score: 18,
            internal_reputation_score: 12,
            external_reputation_score: 10,
            total_score: 65,
          });
        }

        // Número de publicaciones
        const { count } = await supabaseBrowser
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setPostCount(count ?? 0);
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 2) Subir y guardar avatar
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Error HTTP al subir avatar:", await uploadRes.text());
        alert("No se ha podido subir el avatar.");
        return;
      }

      const { publicUrl } = (await uploadRes.json()) as {
        publicUrl: string;
      };

      if (!publicUrl) {
        alert("No se ha recibido la URL pública del avatar.");
        return;
      }

      const { error: updateError } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", currentUser.id);

      if (updateError) {
        console.error("Error actualizando avatar_url en profiles:", updateError);
        alert("No se ha podido guardar el avatar en tu perfil.");
        return;
      }

      // Actualizar estado local para verlo al momento
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: publicUrl } : prev
      );
    } catch (err) {
      console.error("Error en handleAvatarChange:", err);
      alert("Error inesperado al subir el avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando perfil…</p>
      </main>
    );
  }

  if (!currentUser) {
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

  const name =
    profile?.full_name || currentUser.email || "Usuario Ethiqia";

  const totalScore = score?.total_score ?? 65;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera perfil */}
        <header className="flex items-center gap-6">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center text-2xl font-semibold">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <span>{name[0]?.toUpperCase() ?? "U"}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-semibold">{name}</h1>
            {profile?.bio && (
              <p className="text-sm text-neutral-400 mt-1">
                {profile.bio}
              </p>
            )}
            <div className="flex gap-4 text-xs text-neutral-400 mt-2">
              <span>{postCount} publicaciones</span>
              <span>0 seguidores</span>
              <span>0 siguiendo</span>
            </div>
          </div>

          <div>
            <label className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarUploading ? "Subiendo…" : "Cambiar foto de perfil"}
            </label>
          </div>
        </header>

        {/* Tarjeta Score Ethiqia (mismo diseño que ya tenías) */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <h2 className="text-lg font-semibold">Score Etiqia</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Versión inicial de tu puntuación. Se irá refinando con tu
                actividad y las integraciones externas.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalScore}</div>
              <div className="text-xs text-neutral-400">
                PUNTUACIÓN ACTUAL
              </div>
            </div>
          </div>

          {/* Barras – de momento usan los valores del score (o fallback) */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Transparencia</span>
                <span>{score?.transparency_score ?? 25}/35</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((score?.transparency_score ?? 25) / 35) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Conducta y actividad positiva</span>
                <span>{score?.positive_behavior_score ?? 18}/25</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((score?.positive_behavior_score ?? 18) / 25) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Reputación interna</span>
                <span>
                  {score?.internal_reputation_score ?? 12}/20
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((score?.internal_reputation_score ?? 12) /
                        20) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Reputación externa verificada</span>
                <span>
                  {score?.external_reputation_score ?? 10}/20
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((score?.external_reputation_score ?? 10) /
                        20) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 mt-2">
            Nota: La reputación externa (compras verificadas, eventos,
            integraciones con empresas como Velet, etc.) se activará a
            medida que integremos más fuentes de datos reales.
          </p>
        </section>

        {/* Tus publicaciones debajo – aquí tú ya tienes el listado de posts */}
      </section>
    </main>
  );
}
