"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type FollowUser = {
  id: string;
  full_name: string;
};

export default function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const targetId = params?.id;

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Modal listas
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(
    null
  );
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);

  const displayName = useMemo(() => {
    const fn = (profile?.full_name ?? "").trim();
    const un = (profile?.username ?? "").trim();
    if (fn) return fn;
    if (un) return `@${un.replace(/^@/, "")}`;
    return "Usuario Ethiqia";
  }, [profile]);

  const usernameLabel = useMemo(() => {
    const un = (profile?.username ?? "").trim();
    return un ? `@${un.replace(/^@/, "")}` : null;
  }, [profile]);

  const initial = useMemo(() => {
    const s = (displayName || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [displayName]);

  const avatarUrl = useMemo(() => {
    const u = (profile?.avatar_url ?? "").trim();
    return u || null;
  }, [profile]);

  const bioText = useMemo(() => {
    const b = (profile?.bio ?? "").trim();
    return b || null;
  }, [profile]);

  const locationText = useMemo(() => {
    const loc = (profile?.location ?? "").trim();
    return loc || null;
  }, [profile]);

  const websiteUrl = useMemo(() => {
    const w = (profile?.website ?? "").trim();
    return w || null;
  }, [profile]);

  const instagramUrl = useMemo(() => {
    const v = (profile?.instagram_url ?? profile?.instagram ?? "").trim();
    return v || null;
  }, [profile]);

  const linkedinUrl = useMemo(() => {
    const v = (profile?.linkedin_url ?? profile?.linkedin ?? "").trim();
    return v || null;
  }, [profile]);

  const isVerified = useMemo(() => {
    return Boolean(profile?.is_verified ?? profile?.verified ?? false);
  }, [profile]);

  const loadProfile = async () => {
    if (!targetId) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Error cargando profile (/u/[id]):", error);
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadCounts = async () => {
    if (!targetId) return;
    setLoadingCounts(true);
    try {
      const res = await fetch(
        `/api/follow-stats?userId=${encodeURIComponent(targetId)}`
      );
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

  const loadPosts = async () => {
    if (!targetId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      const all = (json?.posts ?? []) as any[];
      const mine = all.filter((p) => p.user_id === targetId);
      setPosts(mine as Post[]);
    } catch (e) {
      console.error("Error cargando posts (/u/[id]):", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetId) return;
    if (currentUserId === targetId) {
      setIsFollowing(false);
      return;
    }

    try {
      // Si tu /api/follow soporta GET status, lo intentamos
      const res = await fetch(
        `/api/follow?targetId=${encodeURIComponent(targetId)}`,
        { method: "GET" }
      );

      if (res.ok) {
        const json = await res.json();
        setIsFollowing(Boolean(json.following ?? json.isFollowing ?? false));
        return;
      }
    } catch {
      // ignoramos y pasamos al fallback
    }

    // Fallback: intentamos por Supabase directo (si RLS lo permite)
    try {
      const { data, error } = await supabaseBrowser
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetId)
        .maybeSingle();

      if (!error && data) setIsFollowing(true);
      else setIsFollowing(false);
    } catch {
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId || !targetId) return;
    if (currentUserId === targetId) return;

    setTogglingFollow(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error("Error toggle follow:", json);
        alert("No se ha podido actualizar el seguimiento.");
        return;
      }

      const next = Boolean(json.following ?? json.isFollowing ?? false);
      setIsFollowing(next);

      // Ajuste rápido UI + refresco real
      setFollowersCount((prev) => {
        if (next && !isFollowing) return prev + 1;
        if (!next && isFollowing) return Math.max(0, prev - 1);
        return prev;
      });

      await loadCounts();
    } finally {
      setTogglingFollow(false);
    }
  };

  const openList = async (kind: "followers" | "following") => {
    if (!targetId) return;
    setListOpen(kind);
    setListLoading(true);
    setListUsers([]);

    try {
      const res = await fetch(
        `/api/follow-list?userId=${encodeURIComponent(targetId)}&kind=${kind}`
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

  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      console.error("Error cerrando sesión:", e);
      alert("No se ha podido cerrar sesión.");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        setCurrentUserId(user?.id ?? null);

        // Si entras en tu propio /u/[id], te mando a /profile
        if (user?.id && targetId && user.id === targetId) {
          window.location.href = "/profile";
          return;
        }

        await Promise.all([loadProfile(), loadCounts(), loadPosts()]);
      } catch (e) {
        console.error("Error init /u/[id]:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  useEffect(() => {
    if (!authChecked) return;
    checkFollowStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, currentUserId, targetId]);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </main>
    );
  }

  if (!targetId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Perfil inválido.</p>
      </main>
    );
  }

  if (!loadingProfile && !profile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between">
            <Link
              href="/feed"
              className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
            >
              ← Volver al feed
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <h1 className="text-lg font-semibold">Perfil no encontrado</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Este usuario no existe o no es público.
            </p>
          </div>
        </section>
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

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
            >
              Mi perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative h-16 w-16 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-xl font-semibold">{initial}</span>
                )}
              </div>

              {/* Nombre + meta */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-semibold">
                    {loadingProfile ? "Cargando…" : displayName}
                  </div>

                  {isVerified && (
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-600/30">
                      Verificado
                    </span>
                  )}
                </div>

                {usernameLabel && (
                  <div className="text-xs text-neutral-400">{usernameLabel}</div>
                )}

                {locationText && (
                  <div className="text-xs text-neutral-400 mt-1">
                    📍 {locationText}
                  </div>
                )}

                <div className="mt-3 flex gap-6 text-sm">
                  <div>
                    <div className="text-white font-semibold">
                      {loadingPosts ? "…" : posts.length}
                    </div>
                    <div className="text-xs text-neutral-400">publicaciones</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openList("followers")}
                    className="text-left hover:text-emerald-400 transition-colors"
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
                    className="text-left hover:text-emerald-400 transition-colors"
                    disabled={loadingCounts}
                  >
                    <div className="text-white font-semibold">
                      {loadingCounts ? "…" : followingCount}
                    </div>
                    <div className="text-xs text-neutral-400">siguiendo</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Botón seguir */}
            {currentUserId && currentUserId !== targetId && (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={togglingFollow}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${
                  isFollowing
                    ? "border-neutral-700 bg-black text-white hover:border-neutral-500"
                    : "border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400"
                } disabled:opacity-60`}
              >
                {togglingFollow
                  ? "Actualizando…"
                  : isFollowing
                  ? "Siguiendo"
                  : "Seguir"}
              </button>
            )}
          </div>

          {/* Bio + links */}
          <div className="mt-5 space-y-3">
            {bioText ? (
              <p className="text-sm text-neutral-200 whitespace-pre-line">
                {bioText}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Sin bio todavía.</p>
            )}

            {(websiteUrl || instagramUrl || linkedinUrl) && (
              <div className="flex flex-wrap gap-2">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs hover:border-neutral-600"
                  >
                    🔗 Web
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs hover:border-neutral-600"
                  >
                    📷 Instagram
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs hover:border-neutral-600"
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3">Publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no hay publicaciones.
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
