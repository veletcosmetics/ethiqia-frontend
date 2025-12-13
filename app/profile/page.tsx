"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";

type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
};

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

  const displayName = useMemo(() => {
    return profile?.full_name?.trim() || userEmail || "Usuario Ethiqia";
  }, [profile?.full_name, userEmail]);

  const initial = useMemo(() => {
    const s = (displayName || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [displayName]);

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
        .select("id, full_name, bio")
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

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl font-semibold">
                {initial}
              </div>

              <div>
                <div className="text-xl font-semibold">
                  {loadingProfile ? "Cargando…" : displayName}
                </div>
                {userEmail && (
                  <div className="text-xs text-neutral-400">{userEmail}</div>
                )}

                <div className="mt-3 flex gap-6 text-sm">
                  <div>
                    <div className="text-white font-semibold">
                      {loadingPosts ? "…" : posts.length}
                    </div>
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

          {profile?.bio ? (
            <p className="mt-5 text-sm text-neutral-200 whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-5 text-sm text-neutral-500">
              Aún no has añadido bio.
            </p>
          )}
        </div>

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
    </main>
  );
}
