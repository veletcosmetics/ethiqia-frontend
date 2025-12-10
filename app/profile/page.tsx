"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

const supabase = supabaseBrowser;

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ScoreRow = {
  source: string;
  value: number;
};

type ScoreSummary = {
  transparency: number;
  behavior: number;
  internalRep: number;
  externalRep: number;
  total: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [scores, setScores] = useState<ScoreSummary>({
    transparency: 0,
    behavior: 0,
    internalRep: 0,
    externalRep: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Cargar usuario, perfil y scores
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUser(user);

        // Perfil básico
        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, bio, avatar_url")
          .eq("id", user.id)
          .single();

        if (!profileError && profileRow) {
          setProfile(profileRow as ProfileRow);
        }

        // Scores del usuario
        const { data: scoreRows, error: scoreError } = await supabase
          .from("scores")
          .select("source, value")
          .eq("user_id", user.id);

        if (!scoreError && scoreRows) {
          let transparency = 0;
          let behavior = 0;
          let internalRep = 0;
          let externalRep = 0;

          (scoreRows as ScoreRow[]).forEach((row) => {
            const src = row.source ?? "";
            const val = row.value ?? 0;

            if (src.startsWith("TRANSPARENCY")) {
              transparency += val;
            } else if (src.startsWith("BEHAVIOR")) {
              behavior += val;
            } else if (src.startsWith("INTERNAL")) {
              internalRep += val;
            } else if (src.startsWith("EXTERNAL") || src.startsWith("API_")) {
              externalRep += val;
            }
          });

          const totalRaw = transparency + behavior + internalRep + externalRep;
          const total = Math.max(0, Math.min(100, totalRaw));

          setScores({ transparency, behavior, internalRep, externalRep, total });
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Guardar nombre + bio
  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error guardando perfil:", error);
        setMessage("No se ha podido guardar el perfil.");
        return;
      }

      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error inesperado guardando perfil:", err);
      setMessage("Ha ocurrido un error guardando el perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Subir avatar usando el mismo /api/upload que los posts
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
        throw new Error("Error subiendo la imagen de perfil");
      }

      const data = await res.json();
      const publicUrl = data.publicUrl as string | undefined;

      if (!publicUrl) {
        throw new Error("Respuesta sin URL pública");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (error) {
        console.error("Error guardando avatar_url:", error);
        setMessage("No se ha podido guardar la foto de perfil.");
        return;
      }

      setProfile((prev) =>
        prev ? { ...prev, avatar_url: publicUrl } : prev
      );
      setMessage("Foto de perfil actualizada.");
    } catch (err) {
      console.error("Error subiendo avatar:", err);
      setMessage("Ha ocurrido un error subiendo la foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Estados de carga / sin sesión
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando perfil…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-neutral-400">
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
    (user.user_metadata as any)?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario Ethiqia";

  const avatarUrl = profile?.avatar_url || null;

  const formatBlock = (value: number, max: number) => {
    const v = Math.max(0, Math.min(max, value));
    const pct = (v / max) * 100;
    return { v, pct };
  };

  const t = formatBlock(scores.transparency, 35);
  const b = formatBlock(scores.behavior, 25);
  const i = formatBlock(scores.internalRep, 20);
  const e = formatBlock(scores.externalRep, 20);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Cabecera + avatar */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center text-xl font-semibold">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span>{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-xs text-neutral-400">{user.email}</p>
            <p className="mt-1 text-sm text-neutral-300">
              {profile?.bio || "Añade una breve descripción sobre ti."}
            </p>
          </div>
        </div>

        {/* Subir avatar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Foto de perfil</h2>
          <div className="flex items-center gap-3 text-xs">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-xs"
            />
            {uploadingAvatar && (
              <span className="text-neutral-400">
                Subiendo foto de perfil…
              </span>
            )}
          </div>
        </div>

        {/* Edición básica de perfil */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Información básica</h2>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={profile?.full_name ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev
                      ? { ...prev, full_name: e.target.value }
                      : {
                          id: user.id,
                          full_name: e.target.value,
                          bio: "",
                          avatar_url: null,
                        }
                  )
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                value={profile?.bio ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev
                      ? { ...prev, bio: e.target.value }
                      : {
                          id: user.id,
                          full_name: displayName,
                          bio: e.target.value,
                          avatar_url: null,
                        }
                  )
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-xs font-semibold disabled:opacity-60"
            >
              {savingProfile ? "Guardando…" : "Guardar perfil"}
            </button>
          </div>
        </div>

        {/* Bloque de Score Etiqia */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Score Etiqia</h2>
              <p className="text-xs text-neutral-400">
                Versión inicial basada en tus publicaciones auténticas.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-emerald-400">
                {scores.total}/100
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-300">Transparencia</span>
                <span className="text-neutral-400">{t.v}/35</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${t.pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-300">
                  Conducta y actividad positiva
                </span>
                <span className="text-neutral-400">{b.v}/25</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-300">Reputación interna</span>
                <span className="text-neutral-400">{i.v}/20</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60"
                  style={{ width: `${i.pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-300">
                  Reputación externa verificada
                </span>
                <span className="text-neutral-400">{e.v}/20</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60"
                  style={{ width: `${e.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <p className="text-xs text-emerald-400 whitespace-pre-line">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
