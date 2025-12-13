"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
};

type FollowUser = {
  id: string;
  full_name: string;
};

export default function UserProfilePage() {
  const params = useParams();

  const profileId = useMemo(() => {
    const raw = (params as any)?.id;
    const val = Array.isArray(raw) ? raw[0] : raw;
    return typeof val === "string" ? val : "";
  }, [params]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Modal listas
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);

  const isMine = useMemo(() => {
    const me = (currentUserId ?? "").toLowerCase();
    const pid = (profileId ?? "").toLowerCase();
    return Boolean(me && pid && me === pid);
  }, [currentUserId, profileId]);

  const displayName = profile?.full_name ?? "Usuario Ethiqia";

  useEffect(() => {
    const loadAuth = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    loadAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      alert("No se ha podido cerrar sesión.");
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
    if (!profileId) return;

    setListOpen(kind);
    setListLoading(true);
    setListUsers([]);

    try {
      const res = await fetch(
        `/api/follow-list?userId=${encodeURIComponent(profileId)}&kind=${kind}`
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

  const loadIsFollowing = async (meId: string, targetId: string) => {
    try {
      const { data, error } = await supabaseBrowser
        .from("follows")
        .select("id")
        .eq("follower_id", meId)
        .eq("following_id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Error comprobando follow:", error);
        setIsFollowing(false);
        return;
      }
      setIsFollowing(Boolean(data?.id));
    } catch (e) {
      console.error("Error isFollowing:", e);
      setIsFollowing(false);
    }
  };

  const loadPostsForProfile = async (targetId: string) => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      const all = (json?.posts ?? []) as any[];
      const mine = all.filter((p) => p.user_id === targetId);
      setPosts(mine as Post[]);
    } catch (e) {
      console.error("Error cargando posts del perfil:", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadProfile = async (targetId: string) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("id, full_name, bio")
        .eq("id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Error cargando profile:", error);
        setProfile(null);
      } else {
        setProfile((data as ProfileRow) ?? null);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!profileId) return;

      await loadProfile(profileId);
      await loadCountsServer(profileId);

      if (currentUserId && currentUserId !== profileId) {
        await loadIsFollowing(currentUserId, profileId);
      } else {
        setIsFollowing(false);
      }

      await loadPostsForProfile(profileId);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, currentUserId]);

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      alert("Debes iniciar sesión para seguir.");
      return;
    }
    if (!profileId || currentUserId === profileId) return;

    if (togglingFollow) return;
    setTogglingFollow(true);

    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: profileId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Error /api/follow:", json);
        alert("No se ha podido actualizar el seguimiento.");
        return;
      }

      setIsFollowing(Boolean(json?.following));
      await loadCountsServer(profileId);
    } catch (e) {
      console.error("Error toggle follow:", e);
      alert("Error de red al seguir/dejar de seguir.");
    } finally {
      setTogglingFollow(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando perfil…</p>
      </main>
    );
  }

  if (!profileId) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-red-400">Perfil inválido.</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Perfil no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/feed"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver al feed
          </Link>

          {isMine && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
            >
              Cerrar sesión
            </button>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-base font-semibold">
                {(displayName?.[0]?.toUpperCase() ?? "U")}
              </div>
              <div>
                <div className="text-lg font-semibold">{displayName}</div>
                <div className="text-xs text-neutral-400 break-all">{profile.id}</div>
              </div>
            </div>

            {!isMine && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={!currentUserId || togglingFollow}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors disabled:opacity-60 ${
                  isFollowing
                    ? "border-neutral-700 bg-black text-white hover:border-neutral-500"
                    : "border-emerald-600 bg-emerald-500 text-black hover:bg-emerald-400"
                }`}
              >
                {togglingFollow ? "Procesando…" : isFollowing ? "Dejar de seguir" : "Seguir"}
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <button
              type="button"
              onClick={() => openList("followers")}
              className="text-left hover:text-emerald-400 transition-colors"
              disabled={loadingCounts}
            >
              <div className="text-white font-semibold">{loadingCounts ? "…" : followersCount}</div>
              <div className="text-xs text-neutral-400">Seguidores</div>
            </button>

            <button
              type="button"
              onClick={() => openList("following")}
              className="text-left hover:text-emerald-400 transition-colors"
              disabled={loadingCounts}
            >
              <div className="text-white font-semibold">{loadingCounts ? "…" : followingCount}</div>
              <div className="text-xs text-neutral-400">Siguiendo</div>
            </button>
          </div>

          {profile.bio ? (
            <p className="mt-4 text-sm text-neutral-200 whitespace-pre-line">{profile.bio}</p>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">Este usuario aún no ha añadido bio.</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-base font-semibold mb-3">Publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">Este usuario todavía no tiene publicaciones.</p>
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
                        <div className="text-[10px] text-neutral-500 break-all">{u.id}</div>
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
