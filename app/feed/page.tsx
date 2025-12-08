"use client";

import React, { useEffect, useState, FormEvent } from "react";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type NewPostState = {
  caption: string;
  file: File | null;
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

  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // 1) Cargar usuario actual + su perfil
  useEffect(() => {
    const initAuthAndProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();
        setCurrentUser(user ?? null);

        if (user) {
          // Perfil en tabla profiles (id = user.id)
          const { data: profile, error } = await supabaseBrowser
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();

          if (!error && profile?.display_name) {
            setCurrentUserName(profile.display_name as string);
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

  // 2) Cargar posts reales al entrar
  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Error al cargar posts");
        }
        const data = await res.json();
        setPosts(data.posts ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, []);

  // 3) Gestión del formulario

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNewPost((prev) => ({ ...prev, file }));
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewPost((prev) => ({ ...prev, caption: value }));
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
      // 1) Subir imagen a Supabase Storage vía /api/upload
      const formData = new FormData();
      formData.append("file", newPost.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error("Respuesta upload:", await uploadRes.text());
        throw new Error("Error subiendo la imagen");
      }

      const { publicUrl } = await uploadRes.json();
      const imageUrl: string = publicUrl;

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
        console.error("Respuesta moderation:", await moderationRes.text());
        throw new Error("Error moderando el contenido");
      }

      const moderation = await moderationRes.json();
      const aiProbability: number = moderation.aiProbability ?? 0;
      const blocked: boolean = moderation.blocked ?? false;
      const reason: string | null = moderation.reason ?? null;

      const globalScore = Math.max(
        0,
        Math.min(100, Math.round(100 - aiProbability))
      );

      // 3) Guardar post REAL en la tabla posts con user_id real
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          imageUrl,                  // IMPORTANTE: ahora se envía al backend
          caption: newPost.caption,
          aiProbability,
          globalScore,
          text: newPost.caption,
          blocked,
          reason,
        }),
      });

      if (!saveRes.ok) {
        console.error("Respuesta posts:", await saveRes.text());
        throw new Error("Error guardando el post");
      }

      const { post } = await saveRes.json();

      // 4) Añadir al estado sin recargar
      setPosts((prev) => [post as Post, ...prev]);
      setNewPost({ caption: "", file: null });
      setMessage(
        `Publicación creada correctamente. Probabilidad estimada de IA: ${Math.round(
          aiProbability
        )}%`
      );
    } catch (err) {
      console.error(err);
      setMessage("Ha ocurrido un error al crear la publicación.");
    } finally {
      setSubmitting(false);
    }
  };

  // Si ya hemos comprobado auth y no hay usuario, mensaje claro
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

  // Filtrado para “Solo mis publicaciones”
  const postsToShow = showOnlyMine && currentUser
    ? posts.filter((p) => p.user_id === currentUser.id)
    : posts;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-2">Feed Ethiqia</h1>
        <p className="text-gray-400 mb-6">
          Sube contenido auténtico. Cada publicación se analiza con IA para
          estimar la probabilidad de que la imagen sea generada por IA y
          calcular tu Ethiqia Score.
        </p>

        {/* Formulario de nueva publicación */}
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 rounded-xl p-6 mb-8 space-y-4"
        >
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
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>

          {message && (
            <p className="text-sm text-emerald-400 whitespace-pre-line">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Publicando..." : "Publicar"}
          </button>
        </form>

        {/* Filtro Todo el feed / Solo mis publicaciones */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowOnlyMine(false)}
            className={`px-4 py-2 rounded-full text-sm border ${
              !showOnlyMine
                ? "bg-emerald-500 border-emerald-500"
                : "border-neutral-700"
            }`}
          >
            Todo el feed
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyMine(true)}
            className={`px-4 py-2 rounded-full text-sm border ${
              showOnlyMine
                ? "bg-emerald-500 border-emerald-500"
                : "border-neutral-700"
            }`}
          >
            Solo mis publicaciones
          </button>
        </div>

        {loadingPosts && (
          <p className="text-sm text-gray-400">Cargando publicaciones...</p>
        )}

        {!loadingPosts && postsToShow.length === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay publicaciones. Sube la primera foto auténtica.
          </p>
        )}

        <div className="space-y-4 mt-4">
          {postsToShow.map((post) => {
            // Si el post es del usuario actual, mostramos su nombre real
            const isMine = currentUser && post.user_id === currentUser.id;
            const authorName = isMine ? currentUserName : "Usuario Ethiqia";

            return (
              <PostCard key={post.id} post={post} authorName={authorName} />
            );
          })}
        </div>
      </section>
    </main>
  );
}
