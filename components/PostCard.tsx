"use client";

import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

export type Post = {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  text: string | null;
  created_at: string;
  ai_probability: number | null;
  global_score: number | null;
  blocked: boolean | null;
};

type PostCardProps = {
  post: Post;
  authorName: string;
};

export default function PostCard({ post, authorName }: PostCardProps) {
  const [likesCount, setLikesCount] = useState<number>(0);
  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Formatear fecha
  const createdAt = post.created_at ? new Date(post.created_at) : null;
  const formattedDate = createdAt
    ? createdAt.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const aiProb = post.ai_probability ?? 0;
  const authenticityScore = post.global_score ?? Math.max(0, Math.min(100, 100 - aiProb));

  // Cargar usuario actual + likes del post
  useEffect(() => {
    const fetchLikesAndUser = async () => {
      const supabase = supabaseBrowser();

      // 1) Usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error obteniendo usuario en PostCard:", userError);
      }

      const userId = user?.id ?? null;
      setCurrentUserId(userId);

      // 2) Contador total de likes del post
      const { error: countError, count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (countError) {
        console.error("Error obteniendo número de likes:", countError);
      } else if (typeof count === "number") {
        setLikesCount(count);
      }

      // 3) Saber si ESTE usuario ya ha dado like
      if (userId) {
        const { data: existingLike, error: likeError } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (likeError && likeError.code !== "PGRST116") {
          // PGRST116 = no rows; no es un error grave
          console.error("Error comprobando si el usuario ha dado like:", likeError);
        }

        setLikedByMe(!!existingLike);
      } else {
        setLikedByMe(false);
      }
    };

    fetchLikesAndUser();
  }, [post.id]);

  const handleToggleLike = async () => {
    if (!currentUserId) {
      alert("Debes iniciar sesión para dar like.");
      return;
    }

    setLikeLoading(true);
    const supabase = supabaseBrowser();

    try {
      if (likedByMe) {
        // Quitar like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("Error al quitar like:", error);
          return;
        }

        setLikedByMe(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Dar like
        const { error } = await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });

        if (error) {
          // 23505 = violación de unique constraint (ya tenía like)
          if (error.code === "23505") {
            setLikedByMe(true);
          } else {
            console.error("Error al dar like:", error);
            return;
          }
        } else {
          setLikedByMe(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error inesperado al cambiar like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <article className="bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-800">
      {/* Cabecera: avatar + nombre + fecha */}
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-semibold">
            {authorName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-sm font-semibold">{authorName}</p>
            {formattedDate && (
              <p className="text-xs text-gray-500">{formattedDate}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs sm:text-[13px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-emerald-400">
            Score autenticidad:{" "}
            <span className="font-semibold">{authenticityScore}</span>/100
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-gray-400">
            Prob. IA: <span className="font-semibold">{aiProb.toFixed(1)}%</span>
          </span>
        </div>
      </header>

      {/* Imagen */}
      {post.image_url && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption ?? "Publicación Ethiqia"}
            className="w-full max-h-[520px] object-cover"
          />
        </div>
      )}

      {/* Texto / caption */}
      {(post.caption || post.text) && (
        <p className="text-sm text-gray-200 mb-3 whitespace-pre-line">
          {post.caption || post.text}
        </p>
      )}

      {/* Footer: likes (luego aquí podremos añadir comentarios, guardar, compartir, etc.) */}
      <footer className="flex items-center justify-between pt-2 border-t border-neutral-800 mt-2">
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={likeLoading}
          className={`inline-flex items-center gap-1 text-sm transition-colors ${
            likedByMe ? "text-emerald-400" : "text-gray-400 hover:text-emerald-300"
          } disabled:opacity-60`}
        >
          <span>❤️</span>
          <span>{likesCount}</span>
        </button>

        {/* Placeholder para futuras acciones: comentar, compartir, guardar */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Aquí más adelante: Comentarios · Guardar · Compartir */}
        </div>
      </footer>
    </article>
  );
}
