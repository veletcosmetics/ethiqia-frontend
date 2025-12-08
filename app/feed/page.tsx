"use client";

import React, { useEffect, useState, FormEvent } from "react";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type NewPostState = {
  caption: string;
  file: File | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  full_name: string | null;
};

type ProfilesMap = Record<
  string,
  {
    name: string;
  }
>;

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

  // Mapa user_id -> nombre público
  const [profilesMap, setProfilesMap] = useState<ProfilesMap>({});

  /**
   * 1) Cargar usuario actual + su perfil
   */
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
            .select("display_name, full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && profile) {
            const p = profile as ProfileRow;
            const name =
              (p.display_name && p.display_name.trim()) ||
              (p.full_name && p.full_name.trim()) ||
              "Usuario Ethiqia";

            setCurrentUserName(name);

            // Guardamos también en el mapa por si lo necesitamos
            setProfilesMap((prev) => ({
              ...prev,
              [user.id]: { name },
            }));
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

  /**
   * 2) Cargar perfiles de los autores de los posts
   */
  const loadProfilesForPosts = async (postsToProcess: Post[]) => {
    try {
      const userIds = Array.from(
        new Set(
          postsToProcess
            .map((p) => p.user_id)
            .filter((id): id is string => !!id)
        )
      );

      if (userIds.length === 0) return;

      // Filtramos los que ya tenemos en el mapa para no repetir llamadas
      const missingIds = userIds.filter((id) => !profilesMap[id]);
      if (missingIds.length === 0) return;

      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("id, display_name, full_name")
        .in("id", missingIds);

      if (error) {
        console.error("Error cargando perfiles de autores:", error);
        return;
      }

      if (!data || data.length === 0) return;

      const rows = data as ProfileRow[];
      const newMap: ProfilesMap = {};

      for (const row of rows) {
        const name =
          (row.display_name && row.display_name.trim()) ||
          (row.full_name && row.full_name.trim()) ||
          "Usuario Ethiqia";

        newMap[row.id] = { name };
      }

      setProfilesMap((prev) => ({
        ...prev,
        ...newMap,
      }));
    } catch (err) {
      console.error("Error procesando perfiles de posts:", err);
    }
  };

  /**
   * 3) Cargar posts reales al entrar
   */
  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Error al cargar posts");
        }
        const data = await res.json();
        const fetchedPosts: Post[] = data.posts ?? [];
        setPosts(fetchedPosts);

        // Cargamos nombres de autores para esos posts
        if (fetchedPosts.length > 0) {
          await loadProfilesForPosts(fetchedPosts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 4) Manejo del formulario
   */
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
      // 1) Subir imagen a Supabase Storage
      const formData = new FormData();
      formData.append("file", newPost.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Error subiendo la imagen");
      }

      const uploadData = await uploadRes.json();
      const imageUrl: string = uploadData.url;

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
        throw new Error("Error moderando el contenido");
      }

      const moderation = await moderationRes.json();
      const aiProbability = moderation.aiProbability ?? 0;
      const blocked = moderation.blocked ?? false;
      const reason = moderation.reason ?? null;

      const globalScore = Math.max(
        0,
        Math.min(100, Math.round(100 - aiProbability))
      );

      // 3) Guardar post REAL en la tabla posts con user_id real
      const payload = {
        userId: currentUser.id,
        imageUrl,
        caption: newPost.caption,
        aiProbability,
        globalScore,
        text: newPost.caption,
        blocked,
        reason,
      };

      console.log("Enviando payload a /api/posts:", payload);

      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        console.error("Respuesta de /api/posts:", errorText);
        throw new Error("Error guardando el post");
      }

      const { post } = await saveRes.json();

      // 4) Añadir al estado sin recargar
      setPosts((prev) => [post as Post, ...prev]);

      // Aseguramos que el mapa tiene el nombre del usuario actual
      setProfilesMap((prev) => ({
        ...prev,
        [currentUser.id]: { name: currentUserName },
      }));

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

  /**
   * 5) Si ya hemos comprobado auth y no hay usuario
   */
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

  /**
   * 6) Render del feed
   */
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

        {loadingPosts && (
          <p className="text-sm text-gray-400">Cargando publicaciones...</p>
        )}

        {!loadingPosts && posts.length === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay publicaciones. Sube la primera foto auténtica.
          </p>
        )}

        <div className="space-y-4 mt-4">
          {posts.map((post) => {
            const isMine = currentUser && post.user_id === currentUser.id;
            const profileEntry = post.user_id
              ? profilesMap[post.user_id]
              : undefined;

            const authorName =
              profileEntry?.name ||
              (isMine ? currentUserName : "Usuario Ethiqia");

            return (
              <PostCard
                key={post.id}
                post={post}
                authorName={authorName}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
