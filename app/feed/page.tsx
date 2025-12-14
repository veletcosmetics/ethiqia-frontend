"use client";

import React, { useEffect, useMemo, useState, FormEvent } from "react";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type NewPostState = {
  caption: string;
  file: File | null;
};

type ProfileMini = {
  id: string;
  full_name: string | null;
  username: string | null;
};

export default function FeedPage() {
  const [newPost, setNewPost] = useState<NewPostState>({
    caption: "",
    file: null,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Usuario Ethiqia");
  const [authChecked, setAuthChecked] = useState(false);

  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileMini>>({});

  // 1) Cargar usuario actual + perfil
  useEffect(() => {
    const initAuthAndProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        setCurrentUser(user ?? null);

        if (user) {
          const { data: profile, error } = await supabaseBrowser
            .from("profiles")
            .select("full_name, username")
            .eq("id", user.id)
            .maybeSingle();

          if (!error) {
            const name =
              profile?.full_name?.trim() ||
              (profile?.username ? `@${String(profile.username).replace(/^@+/, "")}` : "") ||
              "Usuario Ethiqia";
            setCurrentUserName(name);
          }
        }
      } catch (err) {
        console.error("Error obteniendo usuario/perfil:", err);
      } finally {
        setAuthChecked(true);
      }
    };

    initAuthAndProfile();
  }, []);

  // 2) Cargar posts + map de perfiles
  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) throw new Error("Error al cargar posts");
        const data = await res.json();

        const loaded = (data.posts ?? []) as Post[];
        setPosts(loaded);

        // Cargar nombres de autores (para no mostrar "Usuario Ethiqia")
        const ids = Array.from(
          new Set(loaded.map((p) => p.user_id).filter(Boolean))
        );

        if (ids.length > 0) {
          const { data: profs, error } = await supabaseBrowser
            .from("profiles")
            .select("id, full_name, username")
            .in("id", ids);

          if (!error && Array.isArray(profs)) {
            const map: Record<string, ProfileMini> = {};
            for (const r of profs as any[]) {
              map[r.id] = {
                id: r.id,
                full_name: r.full_name ?? null,
                username: r.username ?? null,
              };
            }
            setProfilesMap(map);
          }
        }
      } catch (err) {
        console.error("Error cargando posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewPost((prev) => ({ ...prev, file }));
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewPost((prev) => ({ ...prev, caption: value }));
  };

  const resolveAuthorName = (userId: string) => {
    const p = profilesMap[userId];
    if (!p) return "Usuario Ethiqia";
    return p.full_name?.trim() || (p.username ? `@${String(p.username).replace(/^@+/, "")}` : "") || "Usuario Ethiqia";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

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
      // 1) Subir imagen a /api/upload
      const formData = new FormData();
      formData.append("file", newPost.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Error en /api/upload:", await uploadRes.text());
        throw new Error("Error subiendo la imagen");
      }

      const uploadJson = await uploadRes.json();
      const imageUrl = (uploadJson.url ?? uploadJson.publicUrl) as string | undefined;

      if (!imageUrl) {
        throw new Error("No se ha recibido la URL pública de la imagen");
      }

      // 2) Moderar con IA
      const moderationRes = await fetch("/api/moderate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: newPost.caption,
          imageUrl,
        }),
      });

      if (!moderationRes.ok) {
        console.error("Error en /api/moderate-post:", await moderationRes.text());
        throw new Error("Error moderando el contenido");
      }

      const moderation = await moderationRes.json();

      const aiProbability = moderation.aiProbability ?? 0;
      const blocked = moderation.blocked ?? false;
      const reason = moderation.reason ?? null;

      const globalScore = Math.max(0, Math.min(100, Math.round(100 - aiProbability)));

      // 3) Guardar post REAL en /api/posts
      const bodyToSend = {
        userId: currentUser.id,
        imageUrl,
        caption: newPost.caption,
        aiProbability,
        globalScore,
        text: newPost.caption,
        blocked,
        reason,
      };

      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      if (!saveRes.ok) {
        console.error("Error en /api/posts:", await saveRes.text());
        throw new Error("Error guardando el post");
      }

      const { post } = await saveRes.json();

      // 4) Añadir al estado sin recargar
      setPosts((prev) => [post as Post, ...prev]);
      setNewPost({ caption: "", file: null });

      // Cachear el perfil del autor en el map si no estaba
      setProfilesMap((prev) => {
        if (prev[currentUser.id]) return prev;
        return {
          ...prev,
          [currentUser.id]: {
            id: currentUser.id,
            full_name: currentUserName.startsWith("@") ? null : currentUserName,
            username: currentUserName.startsWith("@") ? currentUserName.replace(/^@+/, "") : null,
          },
        };
      });

      setMessage(
        `Publicación creada correctamente. Probabilidad estimada de IA: ${Math.round(aiProbability)}%`
      );
    } catch (err) {
      console.error("Error creando publicación:", err);
      setMessage("Ha ocurrido un error al crear la publicación.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecked && !currentUser) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold">Ethiqia</h1>
          <p className="text-sm text-gray-400">
            Debes iniciar sesión para ver y publicar en el feed.
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

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-2">Feed Ethiqia</h1>
        <p className="text-gray-400 mb-6">
          Sube contenido auténtico. Cada publicación se analiza con IA para estimar la probabilidad
          de que la imagen sea generada por IA y calcular tu Ethiqia Score.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-xl p-6 mb-8 space-y-4">
          <label className="block text-sm font-medium mb-1">
            Cuenta algo sobre tu foto o contenido auténtico...
          </label>
          <textarea
            className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={3}
            value={newPost.caption}
            onChange={handleCaptionChange}
          />

          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
          </div>

          {message && (
            <p className="text-sm text-emerald-400 whitespace-pre-line">{message}</p>
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
          <p className="text-sm text-gray-500">
            Todavía no hay publicaciones. Sube la primera foto auténtica.
          </p>
        )}

        <div className="space-y-4 mt-4">
          {posts.map((post) => {
            const author = post.user_id ? resolveAuthorName(post.user_id) : "Usuario Ethiqia";
            return <PostCard key={post.id} post={post} authorName={author} />;
          })}
        </div>
      </section>
    </main>
  );
}
