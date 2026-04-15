"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type NewPostState = {
  caption: string;
  file: File | null;
  aiDisclosed: boolean;
};

type ProfileMini = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function computeGlobalScore(aiProbability: any): number {
  const n = typeof aiProbability === "number" ? aiProbability : 0;
  const probPct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(100 - probPct)));
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeedPage() {
  const [newPost, setNewPost] = useState<NewPostState>({
    caption: "",
    file: null,
    aiDisclosed: false,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Usuario Ethiqia");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileMini>>({});

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  // Auth + perfil
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        // Redirect if email not confirmed
        if (user && !user.email_confirmed_at) {
          window.location.href = "/confirm-email";
          return;
        }

        setCurrentUser(user ?? null);

        if (user) {
          const { data: profile, error } = await supabaseBrowser
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && profile) {
            if (profile.full_name) setCurrentUserName(profile.full_name as string);
            if (profile.avatar_url) setCurrentUserAvatar(profile.avatar_url as string);
          }
        }
      } catch (e) {
        console.error("Error obteniendo usuario/perfil:", e);
      } finally {
        setAuthChecked(true);
      }
    };

    init();
  }, []);

  // Cargar posts
  useEffect(() => {
    const load = async () => {
      setLoadingPosts(true);
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch("/api/posts", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          console.error("GET /api/posts failed:", res.status, t);
          return;
        }

        const data = await res.json();
        const list = (data.posts ?? []) as Post[];
        setPosts(list);

        const ids = Array.from(new Set(list.map((p) => p.user_id).filter(Boolean)));
        if (ids.length > 0) {
          const { data: profs, error } = await supabaseBrowser
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", ids);

          if (!error && profs) {
            const next: Record<string, ProfileMini> = {};
            (profs as ProfileMini[]).forEach((p) => (next[p.id] = p));
            setProfilesMap(next);
          } else if (error) {
            console.warn("No se han podido cargar perfiles publicos (RLS):", error);
          }
        }
      } catch (e) {
        console.error("Error cargando posts:", e);
      } finally {
        setLoadingPosts(false);
      }
    };

    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewPost((prev) => ({ ...prev, file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPost((prev) => ({ ...prev, caption: e.target.value }));
  };

  const handleAiDisclosedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPost((prev) => ({ ...prev, aiDisclosed: e.target.checked }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageIsError(false);
    setLastPoints(null);

    if (!currentUser) {
      setMessage("Debes iniciar sesion para publicar.");
      return;
    }
    if (!newPost.file) {
      setMessage("Primero selecciona una imagen.");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setMessage("Sesion no valida. Vuelve a iniciar sesion.");
        return;
      }

      // 1) upload
      const formData = new FormData();
      formData.append("file", newPost.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        console.error("Error en /api/upload:", errBody);
        throw new Error(errBody.error ?? "Error subiendo la imagen");
      }

      const uploadJson = await uploadRes.json();
      const imageUrl = (uploadJson.url ?? uploadJson.publicUrl) as string | undefined;
      if (!imageUrl) throw new Error("No se ha recibido la URL publica de la imagen");

      // 2) moderate
      const moderationRes = await fetch("/api/moderate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: newPost.caption, imageUrl }),
      });

      let aiProbability = 0;
      let blocked = false;
      let reason: string | null = null;

      if (moderationRes.ok) {
        const moderation = await moderationRes.json();
        aiProbability = moderation.aiProbability ?? 0;
        blocked = moderation.blocked ?? !moderation.allowed;
        reason = moderation.reason ?? null;
      } else {
        // Moderacion no disponible — continuar sin bloquear
        console.warn("Moderacion no disponible, continuando:", moderationRes.status);
      }

      if (blocked) {
        setMessageIsError(true);
        setMessage(
          `Tu publicacion ha sido rechazada por la moderacion IA.\n${reason ?? "Contenido no permitido segun las normas de Ethiqia."}`
        );
        return;
      }

      const globalScore = computeGlobalScore(aiProbability);

      // 3) save post
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageUrl,
          caption: newPost.caption,
          aiProbability,
          globalScore,
          text: newPost.caption,
          blocked,
          reason,
          aiDisclosed: newPost.aiDisclosed,
        }),
      });

      if (!saveRes.ok) {
        const errBody = await saveRes.json().catch(() => ({}));
        console.error("Error en /api/posts:", errBody);
        throw new Error(errBody.error ?? "Error guardando el post");
      }

      const saved = await saveRes.json();
      const post = saved.post as Post;
      const pointsAwarded = typeof saved.points_awarded === "number" ? saved.points_awarded : 3;

      setPosts((prev) => [{ ...post, liked_by_me: false }, ...prev]);
      setNewPost({ caption: "", file: null, aiDisclosed: false });
      setPreviewUrl(null);
      setShowForm(false);
      setMessageIsError(false);
      setLastPoints(pointsAwarded);
      setMessage(`Publicacion creada. +${pointsAwarded} puntos.`);

      try {
        const flash = {
          title: "Publicacion creada",
          body: newPost.aiDisclosed
            ? `Has ganado +${pointsAwarded} puntos (+3 por publicar, +1 por transparencia IA).`
            : `Has ganado +${pointsAwarded} puntos por publicar.`,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("ethiqia_flash", JSON.stringify(flash));
      } catch (err) {
        console.warn("No se pudo guardar ethiqia_flash:", err);
      }
    } catch (err) {
      console.error("Error creando publicacion:", err);
      setMessageIsError(true);
      setMessage("Ha ocurrido un error al crear la publicacion. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auth gate
  if (authChecked && !currentUser) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl font-bold mb-2">
            E
          </div>
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-neutral-400 max-w-xs mx-auto">
            Inicia sesion para ver y publicar en el feed de reputacion etica.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-2.5 text-sm font-semibold transition-colors"
          >
            Iniciar sesion
          </a>
        </div>
      </main>
    );
  }

  const myId = currentUser?.id ?? null;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Feed</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Feed global · descubre la comunidad</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-neutral-700/50 flex items-center justify-center"
            >
              {currentUserAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUserAvatar} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{currentUserName[0]?.toUpperCase() ?? "U"}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Create post trigger */}
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full mb-6 rounded-2xl border border-neutral-800/60 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700/60 transition-all p-4 flex items-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
              {currentUserAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUserAvatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{currentUserName[0]?.toUpperCase() ?? "U"}</span>
              )}
            </div>
            <span className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors">
              Que quieres compartir hoy?
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-neutral-600 group-hover:text-emerald-500 transition-colors">
                <ImageIcon className="h-5 w-5" />
              </span>
            </div>
          </button>
        ) : (
          /* Create post form */
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-neutral-800/60 bg-neutral-900/80 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  {currentUserAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUserAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{currentUserName[0]?.toUpperCase() ?? "U"}</span>
                  )}
                </div>
                <textarea
                  className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none resize-none min-h-[60px]"
                  rows={3}
                  placeholder="Cuenta algo sobre tu foto..."
                  value={newPost.caption}
                  onChange={handleCaptionChange}
                />
              </div>

              {/* Image preview */}
              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-neutral-700/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setNewPost((prev) => ({ ...prev, file: null }));
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-neutral-400 hover:text-emerald-400 transition-colors">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <ImageIcon className="h-5 w-5" />
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer hover:text-neutral-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={newPost.aiDisclosed}
                    onChange={handleAiDisclosedChange}
                    className="accent-emerald-500 rounded"
                  />
                  Contenido con IA
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setPreviewUrl(null);
                    setNewPost({ caption: "", file: null, aiDisclosed: false });
                    setMessage(null);
                  }}
                  className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              messageIsError
                ? "bg-red-500/10 border border-red-900/30 text-red-300"
                : "bg-emerald-500/10 border border-emerald-900/30 text-emerald-300"
            }`}
          >
            <p className="whitespace-pre-line">{message}</p>
            {!messageIsError && typeof lastPoints === "number" && (
              <Link href="/profile" className="inline-flex text-xs text-emerald-400 hover:text-emerald-300 mt-2">
                Ver mi perfil →
              </Link>
            )}
          </div>
        )}

        {/* Loading */}
        {loadingPosts && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-neutral-400">
              <div className="w-5 h-5 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm">Cargando publicaciones...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loadingPosts && posts.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 mb-2">
              <PlusIcon className="h-6 w-6 text-neutral-500" />
            </div>
            <p className="text-sm text-neutral-400">Todavia no hay publicaciones.</p>
            <p className="text-xs text-neutral-600">Se el primero en publicar algo.</p>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => {
            const isMine = myId && post.user_id === myId;
            const profile = profilesMap[post.user_id];
            const authorName = isMine ? currentUserName : profile?.full_name?.trim() || "Usuario Ethiqia";
            const authorAvatarUrl = isMine ? (currentUserAvatar ?? profile?.avatar_url ?? null) : (profile?.avatar_url ?? null);

            // Para reposts: el authorName es quien reposteo, el post original se muestra dentro
            const postWithRepostName = post.repost_of
              ? { ...post, repost_author_name: authorName }
              : post;

            return (
              <PostCard
                key={post.id}
                post={postWithRepostName}
                authorName={authorName}
                authorId={post.user_id}
                authorAvatarUrl={authorAvatarUrl}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
