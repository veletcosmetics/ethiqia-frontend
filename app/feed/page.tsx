"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
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
  const probPct = n <= 1 ? n * 100 : n; // 0..1 o 0..100
  return Math.max(0, Math.min(100, Math.round(100 - probPct)));
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
  const [lastPoints, setLastPoints] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Usuario Ethiqia");
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

        setCurrentUser(user ?? null);

        if (user) {
          const { data: profile, error } = await supabaseBrowser
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && profile?.full_name) {
            setCurrentUserName(profile.full_name as string);
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
            console.warn("No se han podido cargar perfiles públicos (RLS):", error);
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
    setLastPoints(null);

    if (!currentUser) {
      setMessage("Debes iniciar sesión para publicar.");
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
        setMessage("Sesión no válida. Vuelve a iniciar sesión.");
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
        console.error("Error en /api/upload:", await uploadRes.text());
        throw new Error("Error subiendo la imagen");
      }

      const uploadJson = await uploadRes.json();
      const imageUrl = (uploadJson.url ?? uploadJson.publicUrl) as string | undefined;
      if (!imageUrl) throw new Error("No se ha recibido la URL pública de la imagen");

      // 2) moderate
      const moderationRes = await fetch("/api/moderate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: newPost.caption, imageUrl }),
      });

      if (!moderationRes.ok) {
        console.error("Error en /api/moderate-post:", await moderationRes.text());
        throw new Error("Error moderando el contenido");
      }

      const moderation = await moderationRes.json();
      const aiProbability = moderation.aiProbability ?? 0;
      const blocked = moderation.blocked ?? false;
      const reason = moderation.reason ?? null;

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
        console.error("Error en /api/posts:", await saveRes.text());
        throw new Error("Error guardando el post");
      }

      const saved = await saveRes.json();
      const post = saved.post as Post;
      const pointsAwarded = typeof saved.points_awarded === "number" ? saved.points_awarded : 3;

      setPosts((prev) => [post, ...prev]);
      setNewPost({ caption: "", file: null, aiDisclosed: false });

      setLastPoints(pointsAwarded);
      setMessage(`Publicación creada correctamente.\nHas ganado +${pointsAwarded} puntos.`);

      // 4) flash para /profile
      try {
        const flash = {
          title: "Publicación creada",
          body: newPost.aiDisclosed
            ? `Has ganado +${pointsAwarded} puntos (+3 por publicar, +1 por transparencia IA).`
            : `Has ganado +${pointsAwarded} puntos por publicar.`,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("ethiqia_flash", JSON.stringify(flash));
      } catch (err) {
        console.warn("No se pudo guardar ethqia_flash:", err);
      }
    } catch (err) {
      console.error("Error creando publicación:", err);
      setMessage("Ha ocurrido un error al crear la publicación.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render auth gate
  if (authChecked && !currentUser) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-gray-400">Debes iniciar sesión para ver y publicar en el feed.</p>
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

  const myId = currentUser?.id ?? null;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Feed Ethiqia</h1>
            <p className="text-gray-400">
              Publica contenido y construye reputación. Puedes marcar si has usado IA (transparencia).
            </p>
          </div>

          <Link href="/profile" className="text-xs text-neutral-300 hover:text-emerald-400 transition-colors">
            Mi perfil →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-xl p-6 mb-8 space-y-4">
          <label className="block text-sm font-medium mb-1">Cuenta algo sobre tu foto…</label>
          <textarea
            className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={3}
            value={newPost.caption}
            onChange={handleCaptionChange}
          />

          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300">
            <input
              type="checkbox"
              checked={newPost.aiDisclosed}
              onChange={handleAiDisclosedChange}
              className="accent-emerald-500"
            />
            He usado IA en esta publicación (transparencia)
          </label>

          {message && (
            <div className="space-y-2">
              <p className="text-sm text-emerald-400 whitespace-pre-line">{message}</p>
              {typeof lastPoints === "number" && (
                <Link href="/profile" className="inline-flex text-xs text-neutral-300 hover:text-emerald-400">
                  Ver mi perfil y notificaciones →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Publicando..." : "Publicar"}
          </button>
        </form>

        {loadingPosts && <p className="text-sm text-gray-400">Cargando publicaciones...</p>}

        {!loadingPosts && posts.length === 0 && (
          <p className="text-sm text-gray-500">Todavía no hay publicaciones.</p>
        )}

        <div className="space-y-4 mt-4">
          {posts.map((post) => {
            const isMine = myId && post.user_id === myId;
            const profile = profilesMap[post.user_id];
            const authorName = isMine ? currentUserName : profile?.full_name?.trim() || "Usuario Ethiqia";
            const authorAvatarUrl = profile?.avatar_url ?? null;

            return (
              <PostCard
                key={post.id}
                post={post}
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
