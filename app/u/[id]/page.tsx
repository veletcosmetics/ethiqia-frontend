"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type Post = {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  ai_probability: number | null;
  global_score: number | null;
  blocked: boolean | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  username: string | null;
  location: string | null;
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  verified: boolean | null;
};

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const targetId = params.id;

  const [authChecked, setAuthChecked] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const displayName = useMemo(() => {
    return profile?.full_name?.trim() || "Usuario Ethiqia";
  }, [profile?.full_name]);

  const initial = useMemo(() => {
    const s = (displayName || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [displayName]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select(
          "id, full_name, bio, avatar_url, username, location, website_url, instagram_url, linkedin_url, verified"
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

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      // Reutilizamos tu API actual de posts para no tocar backend
      const res = await fetch("/api/posts");
      const json = await res.json();
      const all = (json?.posts ?? []) as any[];
      const mine = all.filter((p) => p.user_id === targetId);

      // Ordenar desc por fecha si no viene ya ordenado
      mine.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(mine as Post[]);
    } catch (e) {
      console.error("Error cargando posts:", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadCounts = async () => {
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

  const loadFollowingStatus = async (viewer: string) => {
    if (!viewer || viewer === targetId) {
      setIsFollowing(false);
      return;
    }

    try {
      const { data, error } = await supabaseBrowser
        .from("follows")
        .select("id")
        .eq("follower_id", viewer)
        .eq("following_id", targetId)
        .maybeSingle();

      if (error) {
        console.warn("Error comprobando follow:", error);
        setIsFollowing(false);
        return;
      }

      setIsFollowing(Boolean(data?.id));
    } catch (e) {
      console.warn("Follow status error:", e);
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    if (!viewerId) {
      alert("Debes iniciar sesión.");
      return;
    }
    if (viewerId === targetId) return;
    if (togglingFollow) return;

    setTogglingFollow(true);
    try {
      if (isFollowing) {
        const { error } = await supabaseBrowser
          .from("follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("following_id", targetId);

        if (error) {
          console.error("Error unfollow:", error);
          return;
        }

        setIsFollowing(false);
      } else {
        const { error } = await supabaseBrowser.from("follows").insert({
          follower_id: viewerId,
          following_id: targetId,
        });

        if (error) {
          console.error("Error follow:", error);
          return;
        }

        setIsFollowing(true);
      }

      await loadCounts();
    } finally {
      setTogglingFollow(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        setViewerId(user?.id ?? null);

        await loadProfile();
        await loadCounts();
        await loadPosts();

        if (user?.id) {
          await loadFollowingStatus(user.id);
        }
      } catch (e) {
        console.error("Init public profile error:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-400">Perfil no encontrado.</p>
          <Link href="/feed" className="text-sm text-emerald-400 hover:underline">
            Volver al feed
          </Link>
        </div>
      </main>
    );
  }

  const showFollowButton = viewerId && viewerId !== targetId;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/feed"
            className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver al feed
          </Link>

          {showFollowButton && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={togglingFollow}
              className={`rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${
                isFollowing
                  ? "border-neutral-700 bg-black text-white hover:border-neutral-500"
                  : "border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400"
              }`}
            >
              {togglingFollow ? "Procesando…" : isFollowing ? "Siguiendo" : "Seguir"}
            </button>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover border border-neutral-700"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl font-semibold">
                  {initial}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-semibold">
                    {loadingProfile ? "Cargando…" : displayName}
                  </div>
                  {profile.verified && (
                    <span className="text-[10px] rounded-full px-2 py-1 bg-emerald-700/30 border border-emerald-600 text-emerald-200">
                      Verificado
                    </span>
                  )}
                </div>

                {profile.username && (
                  <div className="text-xs text-neutral-400">@{profile.username}</div>
                )}

                {profile.location && (
                  <div className="text-xs text-neutral-400">📍 {profile.location}</div>
                )}

                <div className="mt-3 flex gap-10 text-sm">
                  <div>
                    <div className="text-white font-semibold">{loadingPosts ? "…" : posts.length}</div>
                    <div className="text-xs text-neutral-400">publicaciones</div>
                  </div>

                  <div>
                    <div className="text-white font-semibold">
                      {loadingCounts ? "…" : followersCount}
                    </div>
                    <div className="text-xs text-neutral-400">seguidores</div>
                  </div>

                  <div>
                    <div className="text-white font-semibold">
                      {loadingCounts ? "…" : followingCount}
                    </div>
                    <div className="text-xs text-neutral-400">siguiendo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-5 text-sm text-neutral-200 whitespace-pre-line">{profile.bio}</p>
          ) : (
            <p className="mt-5 text-sm text-neutral-500">Aún no hay bio.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline"
              >
                🔗 {profile.website_url}
              </a>
            )}
            {profile.instagram_url && (
              <a
                href={profile.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-200 hover:text-emerald-400"
              >
                Instagram
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-200 hover:text-emerald-400"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3">Publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">Todavía no hay publicaciones.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href="/feed"
                  title={p.caption ?? ""}
                  className="block rounded-xl overflow-hidden border border-neutral-800 bg-black hover:border-neutral-600 transition-colors"
                >
                  {p.image_url ? (
                    <div className="relative aspect-square">
                      <Image
                        src={p.image_url}
                        alt={p.caption ?? "Post"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-xs text-neutral-500">
                      Sin imagen
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
