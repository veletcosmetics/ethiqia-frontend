// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profession: string | null;
  location: string | null;
  website: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
};

type UserScore = {
  transparency_score: number;
  positive_behavior_score: number;
  internal_reputation_score: number;
  external_reputation_score: number;
  total_score: number;
};

type FollowStats = {
  followers: number;
  following: number;
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [score, setScore] = useState<UserScore | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [myCompany, setMyCompany] = useState<{ handle: string; name: string; score: number; logo_url?: string | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "", bio: "", profession: "", location: "",
    website: "", instagram_url: "", linkedin_url: "", twitter_url: "",
    tiktok_url: "", youtube_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [premiumDemo, setPremiumDemo] = useState(false);

  // 1) Cargar todo: usuario, perfil, score, posts propios, follow stats
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

        // Token para las API routes
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const token = sessionData.session?.access_token ?? null;

        // Perfil
        const { data: profileData } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, bio, avatar_url, profession, location, website, instagram_url, linkedin_url, twitter_url, tiktok_url, youtube_url")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }

        // Score
        const { data: scoreData, error: scoreError } =
          await supabaseBrowser.rpc("calculate_user_score", {
            p_user_id: user.id,
          });

        if (!scoreError && scoreData) {
          setScore(scoreData as UserScore);
        } else {
          setScore({
            transparency_score: 25,
            positive_behavior_score: 18,
            internal_reputation_score: 12,
            external_reputation_score: 10,
            total_score: 65,
          });
        }

        // Numero de publicaciones
        const { count } = await supabaseBrowser
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setPostCount(count ?? 0);

        // Posts propios
        if (token) {
          setLoadingPosts(true);
          try {
            const res = await fetch("/api/posts?mine=1", {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (res.ok) {
              const json = await res.json();
              setMyPosts((json.posts ?? []) as Post[]);
            } else {
              console.error("Error cargando posts propios:", res.status, await res.text().catch(() => ""));
            }
          } finally {
            setLoadingPosts(false);
          }
        }

        // Follow stats
        if (token) {
          try {
            const res = await fetch(`/api/follow-stats?userId=${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (res.ok) {
              const json = await res.json();
              setFollowStats({
                followers: json.followers ?? 0,
                following: json.following ?? 0,
              });
            }
          } catch (e) {
            console.error("Error cargando follow stats:", e);
          }
        }
        // Mi empresa
        try {
          const { data: companyRow } = await supabaseBrowser
            .from("company_profiles")
            .select("handle, name, score, logo_url")
            .eq("owner_user_id", user.id)
            .maybeSingle();
          if (companyRow) setMyCompany(companyRow as any);
        } catch { /* no company_profiles table or no row */ }

      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 3) Subir y guardar avatar
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

  const name = profile?.full_name?.trim() || "Usuario Ethiqia";
  const totalScore = score?.total_score ?? 65;

  const socialLinks = [
    { url: profile?.website, label: profile?.website?.replace(/^https?:\/\//, "") ?? "", prefix: "https://" },
    { url: profile?.instagram_url, label: "Instagram", prefix: "https://instagram.com/" },
    { url: profile?.linkedin_url, label: "LinkedIn", prefix: "https://linkedin.com/in/" },
    { url: profile?.twitter_url, label: "Twitter/X", prefix: "https://x.com/" },
    { url: profile?.tiktok_url, label: "TikTok", prefix: "https://tiktok.com/@" },
    { url: profile?.youtube_url, label: "YouTube", prefix: "https://youtube.com/" },
  ].filter((l) => l.url);

  const inputCls = "w-full rounded-lg bg-black border border-neutral-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Cabecera ── */}
        <header className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <label className="relative h-20 w-20 rounded-full overflow-hidden bg-emerald-700 flex items-center justify-center text-2xl font-semibold shrink-0 cursor-pointer group">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span>{name[0]?.toUpperCase() ?? "U"}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] text-white">{avatarUploading ? "..." : "Cambiar"}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{name}</h1>
                <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 rounded-full px-2 py-0.5">
                  Score: {totalScore}
                </span>
                <Link href="/score-info" className="text-[11px] text-neutral-500 hover:text-emerald-400 transition-colors">
                  Como se calcula? →
                </Link>
              </div>

              {profile?.profession && <p className="text-xs text-emerald-400 mt-0.5">{profile.profession}</p>}
              {profile?.location && <p className="text-xs text-neutral-500 mt-0.5">{profile.location}</p>}

              <div className="flex gap-4 text-xs text-neutral-400 mt-2">
                <span><span className="text-white font-semibold">{postCount}</span> publicaciones</span>
                <span><span className="text-white font-semibold">{followStats.followers}</span> seguidores</span>
                <span><span className="text-white font-semibold">{followStats.following}</span> siguiendo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!editing) {
                  setEditForm({
                    full_name: profile?.full_name ?? "",
                    bio: profile?.bio ?? "",
                    profession: profile?.profession ?? "",
                    location: profile?.location ?? "",
                    website: profile?.website ?? "",
                    instagram_url: profile?.instagram_url ?? "",
                    linkedin_url: profile?.linkedin_url ?? "",
                    twitter_url: profile?.twitter_url ?? "",
                    tiktok_url: profile?.tiktok_url ?? "",
                    youtube_url: profile?.youtube_url ?? "",
                  });
                }
                setEditing(!editing);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
            >
              {editing ? "Cancelar" : "Editar perfil"}
            </button>
          </div>

          {/* Bio y links (modo vista) */}
          {!editing && (
            <div className="mt-4">
              {profile?.bio && <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{profile.bio}</p>}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-neutral-400">
                  {socialLinks.map((l, i) => (
                    <a key={i} href={l.url!.startsWith("http") ? l.url! : l.prefix + l.url!} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formulario de edicion */}
          {editing && (
            <div className="mt-5 pt-5 border-t border-neutral-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Nombre</label>
                  <input className={inputCls} value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Profesion</label>
                  <input className={inputCls} value={editForm.profession} onChange={(e) => setEditForm((f) => ({ ...f, profession: e.target.value }))} placeholder="Ej: Disenadora UX" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Ubicacion</label>
                  <input className={inputCls} value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} placeholder="Ej: Barcelona" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Web</label>
                  <input className={inputCls} value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} placeholder="tusitio.com" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Instagram</label>
                  <input className={inputCls} value={editForm.instagram_url} onChange={(e) => setEditForm((f) => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/usuario" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">LinkedIn</label>
                  <input className={inputCls} value={editForm.linkedin_url} onChange={(e) => setEditForm((f) => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/usuario" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">Twitter / X</label>
                  <input className={inputCls} value={editForm.twitter_url} onChange={(e) => setEditForm((f) => ({ ...f, twitter_url: e.target.value }))} placeholder="https://x.com/usuario" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">TikTok</label>
                  <input className={inputCls} value={editForm.tiktok_url} onChange={(e) => setEditForm((f) => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@usuario" />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 mb-1 block">YouTube</label>
                  <input className={inputCls} value={editForm.youtube_url} onChange={(e) => setEditForm((f) => ({ ...f, youtube_url: e.target.value }))} placeholder="https://youtube.com/@canal" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-neutral-500 mb-1 block">Bio</label>
                <textarea className={`${inputCls} resize-none`} rows={4} value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Cuentanos sobre ti..." />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!currentUser) return;
                  setSaving(true);
                  try {
                    const updates = {
                      full_name: editForm.full_name || null,
                      bio: editForm.bio || null,
                      profession: editForm.profession || null,
                      location: editForm.location || null,
                      website: editForm.website || null,
                      instagram_url: editForm.instagram_url || null,
                      linkedin_url: editForm.linkedin_url || null,
                      twitter_url: editForm.twitter_url || null,
                      tiktok_url: editForm.tiktok_url || null,
                      youtube_url: editForm.youtube_url || null,
                    };
                    // Intentar update, si falla intentar upsert
                    let { error } = await supabaseBrowser.from("profiles").update(updates).eq("id", currentUser.id);
                    if (error) {
                      console.warn("Update failed, trying upsert:", error.message);
                      const res = await supabaseBrowser.from("profiles").upsert({ id: currentUser.id, ...updates }, { onConflict: "id" });
                      error = res.error;
                    }
                    if (error) {
                      console.error("Error guardando perfil:", JSON.stringify(error));
                      alert(`Error guardando perfil: ${error.message ?? error.code ?? "desconocido"}`);
                    } else {
                      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
                      setEditing(false);
                    }
                  } catch (err: any) {
                    console.error("Error guardando perfil:", err);
                    alert(`Error inesperado: ${err?.message ?? "desconocido"}`);
                  } finally { setSaving(false); }
                }}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}
        </header>

        {/* ── Premium ── */}
        <section className={`relative bg-neutral-900 border rounded-2xl overflow-hidden ${premiumDemo ? "border-amber-500/30" : "border-neutral-800"}`}>
          {/* Overlay (solo cuando no esta en demo) */}
          {!premiumDemo && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center px-6">
              <span className="text-2xl mb-2">&#128274;</span>
              <h3 className="text-base font-semibold">Ethiqia Premium</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">Desbloquea estadisticas avanzadas, badge verificado, categoria de creador y mas.</p>
              <div className="flex items-center gap-3 mt-4">
                <button type="button" className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-2 text-sm font-semibold text-black transition-colors">
                  Hazte Premium
                </button>
                <button type="button" onClick={() => setPremiumDemo(true)} className="rounded-full border border-neutral-600 hover:border-neutral-400 px-4 py-2 text-xs text-neutral-300 hover:text-white transition-colors">
                  Ver demo
                </button>
              </div>
            </div>
          )}

          {/* Contenido premium */}
          <div className={`p-6 space-y-5 ${premiumDemo ? "" : "select-none"}`} aria-hidden={!premiumDemo}>
            {/* Header con badge demo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">{premiumDemo ? "Estadisticas avanzadas" : "Estadisticas avanzadas"}</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">PREMIUM</span>
                {premiumDemo && <span className="text-[10px] bg-sky-500/20 text-sky-400 rounded-full px-2 py-0.5 font-medium">DEMO</span>}
              </div>
              {premiumDemo && (
                <button type="button" onClick={() => setPremiumDemo(false)} className="text-[11px] text-neutral-500 hover:text-white transition-colors">
                  Cerrar demo
                </button>
              )}
            </div>

            {/* Metricas */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`rounded-xl p-4 text-center ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className={`text-2xl font-bold ${premiumDemo ? "text-white" : "text-neutral-600"}`}>12.4k</div>
                <div className={`text-[11px] mt-1 ${premiumDemo ? "text-neutral-400" : "text-neutral-600"}`}>Alcance</div>
                {premiumDemo && <div className="text-[10px] text-emerald-400 mt-1">+18% este mes</div>}
              </div>
              <div className={`rounded-xl p-4 text-center ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className={`text-2xl font-bold ${premiumDemo ? "text-white" : "text-neutral-600"}`}>8.1k</div>
                <div className={`text-[11px] mt-1 ${premiumDemo ? "text-neutral-400" : "text-neutral-600"}`}>Impresiones</div>
                {premiumDemo && <div className="text-[10px] text-emerald-400 mt-1">+12% este mes</div>}
              </div>
              <div className={`rounded-xl p-4 text-center ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className={`text-2xl font-bold ${premiumDemo ? "text-emerald-400" : "text-neutral-600"}`}>4.2%</div>
                <div className={`text-[11px] mt-1 ${premiumDemo ? "text-neutral-400" : "text-neutral-600"}`}>Engagement</div>
                {premiumDemo && <div className="text-[10px] text-amber-400 mt-1">Media sector: 2.8%</div>}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`rounded-xl p-4 ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={premiumDemo ? "text-amber-400" : "text-neutral-600"}>&#9989;</span>
                  <span className={`font-medium ${premiumDemo ? "text-neutral-200" : "text-neutral-600"}`}>Badge verificado especial</span>
                </div>
                <p className={`text-[11px] ${premiumDemo ? "text-neutral-400" : "text-neutral-700"}`}>
                  {premiumDemo ? "Tu perfil y posts mostrarian un icono dorado de verificacion premium." : "Icono de verificacion premium visible en tu perfil y posts."}
                </p>
                {premiumDemo && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                    <span>&#9733;</span> <span className="font-medium">{name}</span> <span className="text-[10px] text-neutral-500">asi se veria</span>
                  </div>
                )}
              </div>
              <div className={`rounded-xl p-4 ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={premiumDemo ? "text-sky-400" : "text-neutral-600"}>&#128279;</span>
                  <span className={`font-medium ${premiumDemo ? "text-neutral-200" : "text-neutral-600"}`}>Enlace destacado en bio</span>
                </div>
                <p className={`text-[11px] ${premiumDemo ? "text-neutral-400" : "text-neutral-700"}`}>Enlace visible y destacado al inicio de tu perfil publico.</p>
                {premiumDemo && (
                  <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-400">
                    {profile?.website?.replace(/^https?:\/\//, "") || "tuenlace.com"}
                  </div>
                )}
              </div>
              <div className={`rounded-xl p-4 ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={premiumDemo ? "text-purple-400" : "text-neutral-600"}>&#127941;</span>
                  <span className={`font-medium ${premiumDemo ? "text-neutral-200" : "text-neutral-600"}`}>Categoria de creador</span>
                </div>
                <p className={`text-[11px] ${premiumDemo ? "text-neutral-400" : "text-neutral-700"}`}>
                  {premiumDemo ? "Elige la categoria que mejor te define." : "Influencer, periodista, activista, empresa, artista..."}
                </p>
                {premiumDemo && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Creador", "Activista", "Periodista", "Empresa", "Artista"].map((c) => (
                      <span key={c} className="text-[10px] rounded-full border border-neutral-600 px-2 py-0.5 text-neutral-300">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={`rounded-xl p-4 ${premiumDemo ? "bg-neutral-800 border border-neutral-700/50" : "bg-neutral-800/50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={premiumDemo ? "text-emerald-400" : "text-neutral-600"}>&#128200;</span>
                  <span className={`font-medium ${premiumDemo ? "text-neutral-200" : "text-neutral-600"}`}>Metricas de audiencia</span>
                </div>
                <p className={`text-[11px] ${premiumDemo ? "text-neutral-400" : "text-neutral-700"}`}>Demografia, horarios de actividad, crecimiento mensual.</p>
                {premiumDemo && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px]"><span className="text-neutral-400">18-24 anos</span><span className="text-white">34%</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-neutral-400">25-34 anos</span><span className="text-white">41%</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-neutral-400">35-44 anos</span><span className="text-white">18%</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA en modo demo */}
            {premiumDemo && (
              <div className="text-center pt-2">
                <p className="text-xs text-neutral-500 mb-3">Estos son datos de ejemplo. Con Premium tendrias tus metricas reales.</p>
                <button type="button" className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-2 text-sm font-semibold text-black transition-colors">
                  Hazte Premium
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Mi empresa ── */}
        {myCompany && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Mi empresa</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center overflow-hidden shrink-0">
                {myCompany.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={myCompany.logo_url} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-sm font-bold text-white">{myCompany.name?.[0]?.toUpperCase() ?? "E"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-100">{myCompany.name}</p>
                <p className="text-xs text-emerald-400">Score: {myCompany.score ?? "—"}</p>
              </div>
              <Link
                href={`/company/${myCompany.handle}`}
                className="rounded-full border border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 transition-colors shrink-0"
              >
                Gestionar empresa
              </Link>
            </div>
          </section>
        )}

        {/* ── Publicaciones ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mis publicaciones</h2>
            <Link
              href="/feed"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Ir al feed →
            </Link>
          </div>

          {loadingPosts && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-neutral-400">
                <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-sm">Cargando publicaciones...</span>
              </div>
            </div>
          )}

          {!loadingPosts && myPosts.length === 0 && (
            <div className="text-center py-10 rounded-2xl border border-neutral-800 bg-neutral-900/50">
              <p className="text-sm text-neutral-400">Aun no tienes publicaciones.</p>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center mt-3 rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-xs font-semibold transition-colors"
              >
                Crear primera publicacion
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {myPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                authorName={profile?.full_name ?? name}
                authorId={currentUser?.id}
                authorAvatarUrl={profile?.avatar_url ?? undefined}
                onDelete={(postId) => {
                  setMyPosts((prev) => prev.filter((p) => p.id !== postId));
                  setPostCount((c) => Math.max(0, c - 1));
                }}
              />
            ))}
          </div>
        </section>

      </section>
    </main>
  );
}
