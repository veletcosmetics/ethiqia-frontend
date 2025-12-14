"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import PostCard, { Post } from "@/components/PostCard";
import type { User } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
};

type FollowUser = {
  id: string;
  full_name: string;
  username?: string | null;
  avatar_url?: string | null;
};

function normalizeUrl(url: string) {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

export default function ProfilePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Modal lista seguidores/siguiendo
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);

  // Modal ver post (desde grid)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Modal editar perfil
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Campos editables
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const userId = currentUser?.id ?? null;

  const displayName = useMemo(() => {
    return profile?.full_name?.trim() || userEmail || "Usuario Ethiqia";
  }, [profile?.full_name, userEmail]);

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
          "id, full_name, username, bio, location, website, instagram_url, linkedin_url, avatar_url"
        )
        .eq("id", targetId)
        .maybeSingle();

      if (error) {
        console.error("Error cargando profile:", error);
        setProfile(null);
        return;
      }

      const row = (data as ProfileRow) ?? null;
      setProfile(row);

      // Pre-cargar valores en editor
      setFullName(row?.full_name ?? "");
      setUsername(row?.username ?? "");
      setBio(row?.bio ?? "");
      setLocation(row?.location ?? "");
      setWebsite(row?.website ?? "");
      setInstagramUrl(row?.instagram_url ?? "");
      setLinkedinUrl(row?.linkedin_url ?? "");
      setAvatarUrl(row?.avatar_url ?? "");
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

  const handleOpenEdit = () => {
    // refresca valores desde profile por si acaso
    setFullName(profile?.full_name ?? "");
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? "");
    setLocation(profile?.location ?? "");
    setWebsite(profile?.website ?? "");
    setInstagramUrl(profile?.instagram_url ?? "");
    setLinkedinUrl(profile?.linkedin_url ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    const u = username.trim().replace(/^@+/, "");
    if (u && !/^[a-zA-Z0-9._-]{3,24}$/.test(u)) {
      alert("El @username debe tener 3–24 caracteres y solo letras, números, punto, guion o guion bajo.");
      return;
    }

    setSavingProfile(true);
    try {
      const payload: Partial<ProfileRow> = {
        id: userId,
        full_name: fullName.trim() || null,
        username: u || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() ? normalizeUrl(website) : null,
        instagram_url: instagramUrl.trim() ? normalizeUrl(instagramUrl) : null,
        linkedin_url: linkedinUrl.trim() ? normalizeUrl(linkedinUrl) : null,
        avatar_url: avatarUrl?.trim() ? avatarUrl.trim() : null,
      };

      const { error } = await supabaseBrowser.from("profiles").upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("Error guardando profile:", error);
        alert("No se ha podido guardar el perfil.");
        return;
      }

      await loadProfile(userId);
      setEditOpen(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFile = async (file: File | null) => {
    if (!file || !userId) return;

    setUploadingAvatar(true);
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        alert("Sesión inválida. Vuelve a iniciar sesión.");
        window.location.href = "/login";
        return;
      }

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Upload avatar error:", json);
        alert("No se ha podido subir la foto de perfil.");
        return;
      }

      const url = String(json.url || "");
      if (!url) {
        alert("No se ha recibido URL del avatar.");
        return;
      }

      setAvatarUrl(url);
    } finally {
      setUploadingAvatar(false);
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

        setCurrentUser(user);
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

  const safeUsername = (profile?.username || "").trim().replace(/^@+/, "");
  const showUsername = safeUsername ? `@${safeUsername}` : "";

  const showWebsite = profile?.website?.trim() || "";
  const showInstagram = profile?.instagram_url?.trim() || "";
  const showLinkedin = profile?.linkedin_url?.trim() || "";

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
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

        {/* Card perfil */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold">
                    {(displayName?.[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xl font-semibold truncate">
                  {loadingProfile ? "Cargando…" : displayName}
                </div>

                {showUsername && (
                  <div className="text-sm text-neutral-400 truncate">
                    {showUsername}
                  </div>
                )}

                {profile?.location && (
                  <div className="text-sm text-neutral-400 truncate">
                    📍 {profile.location}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8">
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

          {/* Bio + enlaces */}
          <div className="mt-5 space-y-2">
            {profile?.bio ? (
              <p className="text-sm text-neutral-200 whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Aún no has añadido bio.</p>
            )}

            {showWebsite && (
              <a
                href={showWebsite}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-emerald-400 hover:underline inline-flex items-center gap-2"
              >
                🔗 {showWebsite}
              </a>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {showInstagram && (
                <a
                  href={showInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
                >
                  Instagram
                </a>
              )}
              {showLinkedin && (
                <a
                  href={showLinkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3">Tus publicaciones</h2>

          {loadingPosts ? (
            <p className="text-sm text-neutral-400">Cargando publicaciones…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no has publicado contenido. Sube una foto auténtica desde el feed.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {posts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPost(p)}
                  className="relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-black hover:border-neutral-600"
                  title={p.caption ?? "Ver publicación"}
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.caption ?? "Post"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                      Sin imagen
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal ver post */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Publicación</div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>

            <PostCard post={selectedPost} authorName={displayName} />
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
                        onClick={() => setListOpen(null)}
                      >
                        <div className="text-sm font-semibold">
                          {u.full_name || (u.username ? `@${u.username}` : "Usuario Ethiqia")}
                        </div>
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

      {/* Modal editar perfil */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Editar perfil</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido scrollable */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold">
                      {(displayName?.[0] || "U").toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 block">
                    Cambiar foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
                    className="text-xs"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && (
                    <div className="text-xs text-neutral-400">Subiendo…</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Nombre</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">@username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="ej: davidguirao"
                  />
                  <div className="text-[11px] text-neutral-500 mt-1">
                    3–24 caracteres. Letras, números, punto, guion, guion bajo.
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Ubicación</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="España / Alicante / etc."
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Web</label>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="https://tusitio.com"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Instagram</label>
                  <input
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="https://instagram.com/tuusuario"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">LinkedIn</label>
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                    placeholder="https://linkedin.com/in/tuusuario"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Cuenta quién eres y por qué te deberían seguir…"
                />
              </div>
            </div>

            <div className="p-5 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black disabled:opacity-60"
              >
                {savingProfile ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
