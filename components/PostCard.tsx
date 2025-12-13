"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

export type Post = {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  ai_probability: number | null;
  global_score: number | null;
  text: string | null;
  blocked: boolean | null;
  reason: string | null;
};

type Props = {
  post: Post;
  authorName: string;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
};

const supabase = supabaseBrowser;

export default function PostCard({ post, authorName }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Likes
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [loadingLikes, setLoadingLikes] = useState<boolean>(false);
  const [togglingLike, setTogglingLike] = useState<boolean>(false);

  // ---------- Utilidades ----------

  const createdAt = post.created_at ? new Date(post.created_at) : new Date();

  const formattedDate = createdAt.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const aiProb = post.ai_probability ?? 0;
  const score = post.global_score ?? 0;

  let aiLabel = "Prob. IA: baja";
  let aiColor = "bg-emerald-600";

  if (aiProb >= 70) {
    aiLabel = "Prob. IA: muy alta";
    aiColor = "bg-red-600";
  } else if (aiProb >= 40) {
    aiLabel = "Prob. IA: media";
    aiColor = "bg-yellow-500";
  }

  // ---------- Likes ----------

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);
      } catch (err) {
        console.error("Error obteniendo usuario (likes):", err);
        setCurrentUserId(null);
      }
    };

    loadUser();
  }, []);

  const fetchLikes = async (userId: string | null) => {
    setLoadingLikes(true);
    try {
      // 1) Count total likes del post
      const { count, error: countErr } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (countErr) {
        console.error("Error cargando contador de likes:", countErr);
      } else {
        setLikeCount(count ?? 0);
      }

      // 2) Saber si el usuario actual ya dio like
      if (userId) {
        const { data: mine, error: mineErr } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (mineErr) {
          console.error("Error comprobando like del usuario:", mineErr);
          setLikedByMe(false);
        } else {
          setLikedByMe(Boolean(mine?.id));
        }
      } else {
        setLikedByMe(false);
      }
    } finally {
      setLoadingLikes(false);
    }
  };

  // Cargar likes cuando ya sabemos usuario o cambia el post
  useEffect(() => {
    fetchLikes(currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, post.id]);

  const handleToggleLike = async () => {
    if (!currentUserId) {
      alert("Debes iniciar sesión para dar Me gusta.");
      return;
    }

    if (togglingLike) return;
    setTogglingLike(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUserId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Error en /api/likes:", json);
        alert("No se ha podido actualizar el Me gusta.");
        return;
      }

      const nextLiked = Boolean(json?.liked);
      setLikedByMe(nextLiked);

      // Re-sincroniza desde la base de datos (evita desajustes)
      await fetchLikes(currentUserId);
    } catch (err) {
      console.error("Error toggle like:", err);
      alert("Error de red al actualizar Me gusta.");
    } finally {
      setTogglingLike(false);
    }
  };

  // ---------- Comentarios ----------

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error cargando comentarios", error);
        return;
      }

      setComments((data ?? []) as Comment[]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);

    if (next && comments.length === 0) {
      await fetchComments();
    }
  };

  const handleSendComment = async () => {
    const content = newComment.trim();
    if (!content) return;

    setSendingComment(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error obteniendo usuario", authError);
        alert("Error de sesión, vuelve a iniciar sesión.");
        return;
      }

      if (!user) {
        alert("Debes iniciar sesión para comentar.");
        return;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: post.id,
          user_id: user.id,
          content,
        })
        .select("id, post_id, user_id, content, created_at")
        .single();

      if (error) {
        console.error("Error creando comentario", error);
        alert("No se ha podido publicar el comentario.");
        return;
      }

      if (data) {
        setComments((prev) => [...prev, data as Comment]);
        setNewComment("");
      }
    } finally {
      setSendingComment(false);
    }
  };

  // ---------- Render ----------

  return (
    <article className="bg-neutral-900 rounded-2xl p-4 sm:p-5 mb-4 border border-neutral-800">
      {/* Cabecera */}
      <header className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold">
            {authorName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="text-sm font-semibold">{authorName}</div>
            <div className="text-xs text-neutral-400">{formattedDate}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-neutral-400">
            Ethiqia Score
          </div>
          <div className="text-emerald-400 text-sm font-semibold">
            {score}/100
          </div>
        </div>
      </header>

      {/* Imagen */}
      {post.image_url && (
        <div className="mt-4 relative overflow-hidden rounded-xl border border-neutral-800 bg-black">
          <Image
            src={post.image_url}
            alt={post.caption ?? "Publicación"}
            width={1200}
            height={800}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Texto */}
      {post.caption && (
        <p className="mt-3 text-sm text-neutral-100 whitespace-pre-line">
          {post.caption}
        </p>
      )}

      {/* Badges IA y estado */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${aiColor} text-white`}
        >
          {aiLabel} · {Math.round(aiProb)}%
        </span>

        {post.blocked && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium bg-red-700/70 text-red-50">
            Publicación bloqueada
          </span>
        )}
      </div>

      {/* Botones de interacción */}
      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={loadingLikes || togglingLike}
          className={`flex items-center gap-1 transition-colors ${
            likedByMe ? "text-emerald-400" : "hover:text-emerald-400"
          } disabled:opacity-60`}
          title={likedByMe ? "Quitar Me gusta" : "Dar Me gusta"}
        >
          <span>{likedByMe ? "❤️" : "🤍"}</span>
          <span>Me gusta{likeCount > 0 ? ` (${likeCount})` : ""}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          <span>💬</span>
          <span>
            Comentarios{comments.length > 0 ? ` (${comments.length})` : ""}
          </span>
        </button>
      </div>

      {/* Sección de comentarios */}
      {showComments && (
        <div className="mt-4 border-t border-neutral-800 pt-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-neutral-400">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-neutral-500">
              Todavía no hay comentarios. Sé el primero en comentar.
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.map((comment) => {
                const created = comment.created_at
                  ? new Date(comment.created_at)
                  : null;
                const createdLabel = created
                  ? created.toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <li
                    key={comment.id}
                    className="text-xs bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="font-medium text-neutral-100">
                        Usuario Ethiqia
                      </span>
                      {createdLabel && (
                        <span className="text-[10px] text-neutral-500">
                          {createdLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-neutral-100">{comment.content}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Formulario nuevo comentario */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario auténtico…"
              className="flex-1 rounded-full bg-black border border-neutral-700 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={sendingComment || !newComment.trim()}
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {sendingComment ? "Enviando…" : "Publicar"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
