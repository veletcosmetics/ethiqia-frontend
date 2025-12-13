"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio?: string | null;
};

export default function UserProfilePage() {
  const params = useParams();
  const profileId = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
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

  const displayName = profile?.full_name ?? "Usuario Ethiqia";
  const isMine = Boolean(currentUserId && profileId && currentUserId === profileId);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();
        setCurrentUserId(user?.id ?? null);
      } catch (e) {
        console.error("Error auth:", e);
        setCurrentUserId(null);
      }
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

  const loadCounts = async (targetId: string) => {
    setLoadingCounts(true);
    try {
      const { count: followers, error: e1 } = await supabaseBrowser
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", targetId);

      if (e1) console.error("Error followersCount:", e1);

      const { count: following, error: e2 } = await supabaseBrowser
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetId);

      if (e2) console.error("Error followingCount:", e2);

      setFollowersCount(followers ?? 0);
      setFollowingCount(following ?? 0);
    } finally {
      setLoadingCounts(false);
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

  useEffect(() => {
    const run = async () => {
      if (!profileId) return;

      setLoadingProfile(true);
      try {
        const { data, error } = await supabaseBrowser
          .from("profiles")
          .select("id, full_name, bio")
          .eq("id", profileId)
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

      await loadCounts(profileId);

      if (currentUserId && currentUserId !== profileId) {
        await loadIsFollowing(currentUserId, profileId);
      } else {
        setIsFollowing(false);
      }

      // Posts: reutilizamos /api/posts y filtramos (simple para Beta)
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/posts");
        const json = await res.json();
        const all = (json?.posts ?? []) as any[];
        const mine = all.filter((p) => p.user_id === profileId);
        setPosts(mine as Post[]);
      } catch (e) {
        console.error("Error cargando posts del perfil:", e);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
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

      const next = Boolean(json?.following);
      setIsFollowing(next);

      // Re-sincroniza contadores
      await loadCounts(profileId);
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
                {displayName?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <div className="text-lg font-semibold">{displayName}</div>
                <div className="text-xs text-neutral-400 break-all">
                  {profile.id}
                </div>
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
                {togglingFollow
                  ? "Procesando…"
                  : isFollowing
                  ? "Dejar de seguir"
                  : "Seguir"}
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <div className="text-white font-semibold">
                {loadingCounts ? "…" : followersCount}
              </div>
              <div className="text-xs text-neutral-400">Seguidores</div>
            </div>
            <div>
              <div className="text-white font-semibold">
                {loadingCounts ? "…" : followingCount}
              </div>
              <div className="text-xs text-neutral-400">Siguiendo</div>
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-4 text-sm text-neutral-200 whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              Este usuario aún no ha añadido bio.
            </p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-base font-semibold mb-3">Publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Este usuario todavía no tiene publicaciones.
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
    </main>
  );
}
