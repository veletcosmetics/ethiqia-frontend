"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;

  username?: string | null;

  website?: string | null;
  location?: string | null;

  cover_url?: string | null;
  avatar_url?: string | null;

  is_verified?: boolean | null;

  instagram_url?: string | null;
  tiktok_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
};

type FollowUser = {
  id: string;
  full_name: string;
};

function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function safeHandle(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

function isHandleFormatOk(h: string): boolean {
  if (h.length < 3 || h.length > 20) return false;
  return /^[a-z0-9][a-z0-9_.]*$/.test(h);
}

export default function ProfilePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Modal listas
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);

  // Edit mode
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [editInstagram, setEditInstagram] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editYoutube, setEditYoutube] = useState("");

  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Username
  const [editHandle, setEditHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "error"
  >("idle");

  const displayName = useMemo(() => {
    return profile?.full_name?.trim() || userEmail || "Usuario Ethiqia";
  }, [profile?.full_name, userEmail]);

  const displayHandle = useMemo(() => {
    const u = (profile?.username ?? "").trim();
    return u ? `@${u}` : "@sin_nombre";
  }, [profile?.username]);

  const initial = useMemo(() => {
    const s = (displayName || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [displayName]);

  const badgeVerified = Boolean(profile?.is_verified);

  const coverUrl = profile?.cover_url?.trim() || "";
  const avatarUrl = profile?.avatar_url?.trim() || "";

  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      console.error("Error cerrando sesión:", e);
      alert("No se ha podido cerrar sesión.");
    }
  };

  const loadProfile = async (targetId: string) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select(
          "id, full_name, bio, username, website, location, cover_url, avatar_url, is_verified, instagram_url, tiktok_url, linkedin_url, youtube_url"
        )
        .eq("id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Error cargando profile:", error);
        setProfile(null);
        return;
      }

      setProfile((data as ProfileRow) ?? null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadMyPosts = async (targetId: string) => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      const all = (json?.posts ?? []) as any[];
      const mine = all.filter((p) => p.user_id === targetId);
      setPosts(mine as Post[]);
    } catch (e) {
      console.error("Error cargando posts:", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadCountsServer = async (targetId: string) => {
    setLoadingCounts(true);
    try {
      const res = await fetch(`/api/follow-stats?userId=${encodeURIComponent(targetId)}`);
      const json = await res.json();
      if (!res.ok) {
        console.error("Error follow-stats:", json);
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }
      setFollowersCount(Number(json.followers ?? 0));
      setFollowingCount(Number(json.following ?? 0));
    } finally {
      setLoadingCounts(false);
    }
  };

  const openList = async (kind: "followers" | "following") => {
    if (!userId) return;
    setListOpen(kind);
    setListLoading(true);
    setListUsers([]);

    try {
      const res = await fetch(
        `/api/follow-list?userId=${encodeURIComponent(userId)}&kind=${kind}`
      );
      const json = await res.json();
      if (!res.ok) {
        console.error("Error follow-list:", json);
        setListUsers([]);
        return;
      }
      setListUsers((json.users ?? []) as FollowUser[]);
    } finally {
      setListLoading(false);
    }
  };

  // --- Edit helpers ---
  const openEdit = () => {
    const p = profile;
    setEditFullName(p?.full_name ?? "");
    setEditBio(p?.bio ?? "");
    setEditWebsite(p?.website ?? "");
    setEditLocation(p?.location ?? "");

    setEditInstagram(p?.instagram_url ?? "");
    setEditTiktok(p?.tiktok_url ?? "");
    setEditLinkedin(p?.linkedin_url ?? "");
    setEditYoutube(p?.youtube_url ?? "");

    setEditCoverUrl(p?.cover_url ?? "");
    setEditAvatarUrl(p?.avatar_url ?? "");

    setEditHandle(p?.username ?? "");
    setHandleStatus("idle");
    setEditOpen(true);
  };

  const cancelEdit = () => {
    setEditOpen(false);
    setSaving(false);
    setHandleStatus("idle");
  };

  // Username availability check (debounced)
  useEffect(() => {
    if (!editOpen) return;

    const raw = safeHandle(editHandle);
    if (!raw) {
      setHandleStatus("idle");
      return;
    }

    if (!isHandleFormatOk(raw)) {
      setHandleStatus("invalid");
      return;
    }

    // Si no ha cambiado respecto al actual, no hace falta comprobar
    const current = (profile?.username ?? "").trim().toLowerCase();
    if (raw === current) {
      setHandleStatus("idle");
      return;
    }

    let cancelled = false;
    setHandleStatus("checking");

    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabaseBrowser.rpc("is_username_available", {
          p_username: raw,
        });

        if (cancelled) return;

        if (error) {
          console.error("RPC is_username_available error:", error);
          setHandleStatus("error");
          return;
        }

        setHandleStatus(data === true ? "available" : "taken");
      } catch (e) {
        console.error("is_username_available unexpected:", e);
        if (!cancelled) setHandleStatus("error");
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [editHandle, editOpen, profile?.username]);

  const saveProfile = async () => {
    if (!userId) return;
    if (saving) return;

    setSaving(true);

    try {
      // 1) Update username via RPC si procede
      const desired = safeHandle(editHandle);
      const current = (profile?.username ?? "").trim().toLowerCase();

      if (desired && desired !== current) {
        if (!isHandleFormatOk(desired)) {
          alert("El @name no tiene formato válido.");
          setSaving(false);
          return;
        }

        // Si no está "available", bloqueamos (salvo que haya cambiado a última hora)
        if (handleStatus === "taken") {
          alert("Ese @name ya está ocupado.");
          setSaving(false);
          return;
        }

        const { data, error } = await supabaseBrowser.rpc("set_my_username", {
          p_username: desired,
        });

        if (error) {
          console.error("RPC set_my_username error:", error);
          alert(error.message || "No se ha podido guardar el @name.");
          setSaving(false);
          return;
        }

        // data devuelve el username final
        // seguimos con el resto
      }

      // 2) Update del resto de campos (tabla profiles)
      const payload: any = {
        full_name: editFullName.trim() || null,
        bio: editBio.trim() || null,
        website: editWebsite.trim() ? normalizeUrl(editWebsite) : null,
        location: editLocation.trim() || null,

        instagram_url: editInstagram.trim() ? normalizeUrl(editInstagram) : null,
        tiktok_url: editTiktok.trim() ? normalizeUrl(editTiktok) : null,
        linkedin_url: editLinkedin.trim() ? normalizeUrl(editLinkedin) : null,
        youtube_url: editYoutube.trim() ? normalizeUrl(editYoutube) : null,

        cover_url: editCoverUrl.trim() ? normalizeUrl(editCoverUrl) : null,
        avatar_url: editAvatarUrl.trim() ? normalizeUrl(editAvatarUrl) : null,
      };

      const { error: e2 } = await supabaseBrowser
        .from("profiles")
        .update(payload)
        .eq("id", userId);

      if (e2) {
        console.error("Error update profiles:", e2);
        alert("No se ha podido guardar el perfil.");
        setSaving(false);
        return;
      }

      // 3) Reload profile
      await loadProfile(userId);
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) {
          setAuthChecked(true);
          window.location.href = "/login";
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email ?? null);

        await loadProfile(user.id);
        await loadCountsServer(user.id);
        await loadMyPosts(user.id);
      } catch (e) {
        console.error("Error init profile:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/feed"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver al feed
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openEdit}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
              disabled={loadingProfile}
            >
              Editar perfil
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Perfil bonito */}
        <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900">
          {/* Cover */}
          <div className="relative h-40 sm:h-52 bg-neutral-950 border-b border-neutral-800">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950" />
            )}
          </div>

          {/* Avatar + info */}
          <div className="px-6 pb-6">
            <div className="-mt-10 sm:-mt-12 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-neutral-900 bg-neutral-800 overflow-hidden flex items-center justify-center text-2xl font-semibold">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-semibold">
                      {loadingProfile ? "Cargando…" : displayName}
                    </h1>

                    {badgeVerified && (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        Verificado
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-neutral-400 mt-1">
                    {displayHandle}
                  </div>

                  {profile?.location && (
                    <div className="text-xs text-neutral-400 mt-1">
                      📍 {profile.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Contadores */}
              <div className="flex gap-6 text-sm pb-2">
                <div className="text-center">
                  <div className="text-white font-semibold">
                    {loadingPosts ? "…" : posts.length}
                  </div>
                  <div className="text-xs text-neutral-400">publicaciones</div>
                </div>

                <button
                  type="button"
                  onClick={() => openList("followers")}
                  className="text-center hover:text-emerald-400 transition-colors"
                  disabled={loadingCounts}
                >
                  <div className="text-white font-semibold">
                    {loadingCounts ? "…" : followersCount}
                  </div>
                  <div className="text-xs text-neutral-400">seguidores</div>
                </button>

                <button
                  type="button"
                  onClick={() => openList("following")}
                  className="text-center hover:text-emerald-400 transition-colors"
                  disabled={loadingCounts}
                >
                  <div className="text-white font-semibold">
                    {loadingCounts ? "…" : followingCount}
                  </div>
                  <div className="text-xs text-neutral-400">siguiendo</div>
                </button>
              </div>
            </div>

            {/* Bio + links */}
            <div className="mt-5 space-y-3">
              {profile?.bio ? (
                <p className="text-sm text-neutral-200 whitespace-pre-line">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  Aún no has añadido bio.
                </p>
              )}

              {/* Website */}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-emerald-400 hover:text-emerald-300 break-all"
                >
                  🔗 {profile.website}
                </a>
              )}

              {/* Redes */}
              <div className="flex flex-wrap gap-3 text-sm">
                {profile?.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-3 py-2 hover:border-neutral-600"
                  >
                    <span>📷</span>
                    <span className="text-neutral-200">Instagram</span>
                  </a>
                )}

                {profile?.tiktok_url && (
                  <a
                    href={profile.tiktok_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-3 py-2 hover:border-neutral-600"
                  >
                    <span>🎵</span>
                    <span className="text-neutral-200">TikTok</span>
                  </a>
                )}

                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-3 py-2 hover:border-neutral-600"
                  >
                    <span>💼</span>
                    <span className="text-neutral-200">LinkedIn</span>
                  </a>
                )}

                {profile?.youtube_url && (
                  <a
                    href={profile.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-3 py-2 hover:border-neutral-600"
                  >
                    <span>▶️</span>
                    <span className="text-neutral-200">YouTube</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts (lista por ahora; grid después) */}
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3">Tus publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no has publicado contenido. Sube una foto auténtica desde el feed.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} authorName={displayName} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal editar */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Editar perfil</h3>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Nombre
                </label>
                <input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  @name (Ethiqia)
                </label>
                <input
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="ej: david"
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="mt-1 text-[11px]">
                  {handleStatus === "checking" && (
                    <span className="text-neutral-400">Comprobando…</span>
                  )}
                  {handleStatus === "available" && (
                    <span className="text-emerald-300">Disponible</span>
                  )}
                  {handleStatus === "taken" && (
                    <span className="text-red-300">Ocupado</span>
                  )}
                  {handleStatus === "invalid" && (
                    <span className="text-yellow-300">
                      Inválido (3-20, a-z 0-9 _ .; empieza por letra/número)
                    </span>
                  )}
                  {handleStatus === "error" && (
                    <span className="text-red-300">Error comprobando</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Ubicación
                </label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Bio <span className="text-neutral-500">({editBio.length}/240)</span>
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 240))}
                  rows={3}
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Website
                </label>
                <input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://tuweb.com"
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Instagram
                </label>
                <input
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  TikTok
                </label>
                <input
                  value={editTiktok}
                  onChange={(e) => setEditTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  LinkedIn
                </label>
                <input
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  YouTube
                </label>
                <input
                  value={editYoutube}
                  onChange={(e) => setEditYoutube(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Cover URL (portada)
                </label>
                <input
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-400 mb-1">
                  Avatar URL
                </label>
                <input
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal listas */}
      {listOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {listOpen === "followers" ? "Seguidores" : "Siguiendo"}
              </h3>
              <button
                type="button"
                onClick={() => setListOpen(null)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4">
              {listLoading ? (
                <p className="text-sm text-neutral-400">Cargando…</p>
              ) : listUsers.length === 0 ? (
                <p className="text-sm text-neutral-500">No hay usuarios todavía.</p>
              ) : (
                <ul className="space-y-2">
                  {listUsers.map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/u/${u.id}`}
                        className="block rounded-xl border border-neutral-800 bg-black px-3 py-3 hover:border-neutral-600"
                      >
                        <div className="text-sm font-semibold">{u.full_name}</div>
                        <div className="text-[10px] text-neutral-500 break-all">
                          {u.id}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
