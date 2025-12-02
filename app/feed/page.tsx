"use client";

import React, { useEffect, useState, FormEvent } from "react";
import PostCard, { Post } from "@/components/PostCard";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"; // usuario demo para la beta

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [moderationInfo, setModerationInfo] = useState<string | null>(null);

  // 1) Cargar posts existentes desde /api/posts
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoadingFeed(true);
        setFeedError(null);

        const res = await fetch("/api/posts");
        if (!res.ok) throw new Error("Error al cargar el feed");

        const data = await res.json();
        setPosts(data);
      } catch (err: any) {
        console.error("Error cargando feed:", err);
        setFeedError(err.message || "Error al cargar el feed");
      } finally {
        setLoadingFeed(false);
      }
    }

    loadPosts();
  }, []);

  // 2) Manejar selección de archivo
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setModerationInfo(null);
    setPostError(null);

    if (f) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  }

  // 3) Crear nueva publicación: subir imagen + moderación IA + guardar post
  async function handleCreatePost(e: FormEvent) {
    e.preventDefault();
    setPostError(null);
    setModerationInfo(null);

    if (!file) {
      setPostError("Por ahora necesitas subir una imagen para publicar.");
      return;
    }

    try {
      setUploading(true);

      // 3.1 Subir archivo a /api/upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "Error al subir la imagen");
      }

      const uploadData = await uploadRes.json();
      const imageUrl: string = uploadData.url;

      setUploading(false);
      setCreatingPost(true);

      // 3.2 Crear post con moderación real en /api/posts
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || null,
          imageUrl,
          userId: DEMO_USER_ID, // más adelante: ID real del usuario logueado
        }),
      });

      const postData = await postRes.json();

      if (!postRes.ok) {
        // Si la IA bloquea el contenido
        if (postData.aiProbability !== undefined) {
          setModerationInfo(
            `Publicación bloqueada por moderación (prob. IA: ${postData.aiProbability}%). Motivo: ${postData.reason || "no especificado"}.`
          );
        }
        throw new Error(postData.error || "No se ha podido crear el post");
      }

      // 3.3 Añadir post al inicio del feed
      setPosts((prev) => [postData, ...prev]);

      // 3.4 Limpiar formulario
      setText("");
      setFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setFilePreview(null);
      setModerationInfo(
        `Publicación creada correctamente. Probabilidad estimada de IA: ${
          postData.aiProbability ?? 0
        }%.`
      );
    } catch (err: any) {
      console.error("Error creando post:", err);
      setPostError(err.message || "Error al crear la publicación");
    } finally {
      setUploading(false);
      setCreatingPost(false);
    }
  }

  const isSubmitting = uploading || creatingPost;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabecera */}
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Feed Ethiqia</h1>
          <p className="text-sm text-gray-400">
            Sube contenido auténtico. Cada publicación se analiza con IA para
            estimar la probabilidad de que la imagen sea generada por IA y
            calcular tu Ethiqia Score.
          </p>
        </header>

        {/* Crear nueva publicación */}
        <section className="rounded-2xl border border-zinc-800 bg-black/80 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 mb-1">
            Crear nueva publicación
          </h2>

          <form className="space-y-4" onSubmit={handleCreatePost}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPostError(null);
                setModerationInfo(null);
              }}
              placeholder="Cuenta algo sobre tu foto o contenido auténtico..."
              className="w-full min-h-[80px] rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white resize-none outline-none focus:border-emerald-500"
            />

            <div className="space-y-2">
              <label className="text-xs text-gray-400">
                Selecciona una foto de tu galería
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-300 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-black hover:file:bg-emerald-400"
              />
              {filePreview && (
                <div className="mt-2 rounded-xl border border-zinc-800 bg-black/60 p-2">
                  <img
                    src={filePreview}
                    alt="Previsualización"
                    className="max-h-64 w-full object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            {postError && (
              <p className="text-xs text-red-400">{postError}</p>
            )}

            {moderationInfo && (
              <p className="text-xs text-emerald-400">{moderationInfo}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Analizando..." : "Publicar"}
              </button>
            </div>
          </form>
        </section>

        {/* Feed */}
        <section className="space-y-4">
          {loadingFeed && (
            <p className="text-sm text-gray-400">Cargando publicaciones...</p>
          )}

          {feedError && !loadingFeed && (
            <p className="text-sm text-red-400">{feedError}</p>
          )}

          {!loadingFeed && !feedError && posts.length === 0 && (
            <p className="text-sm text-gray-400">
              Todavía no hay publicaciones. Sube la primera foto auténtica.
            </p>
          )}

          {!loadingFeed &&
            !feedError &&
            posts.map((post) => <PostCard key={post.id} post={post} />)}
        </section>
      </div>
    </div>
  );
}
