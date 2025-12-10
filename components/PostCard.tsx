"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
};

type Props = {
  post: Post;
  authorName: string;
};

export default function PostCard({ post, authorName }: Props) {
  // OJO: aquí está el cambio importante
  const supabase = supabaseBrowser;

  const [likeCount, setLikeCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [savingLike, setSavingLike] = useState<boolean>(false);

  // Cargar usuario actual + likes del post
  useEffect(() => {
    const fetchLikesAndUser = async () => {
      try {
        // 1) Usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id ?? null;
        setCurrentUserId(userId);

        // 2) Likes del post
        const { data: likesData, error: likesError } = await supabase
          .from("post_likes")
          .select("user_id")
          .eq("post_id", post.id);

        if (likesError) {
          console.error("Error obteniendo likes:", likesError);
          return;
        }

        const likes = likesData ?? [];
        setLikeCount(likes.length);

        if (userId) {
          const userHasLiked = likes.some((l) => l.user_id === userId);
          setHasLiked(userHasLiked);
        }
      } catch (err) {
        console.error("Error en fetchLikesAndUser:", err);
      }
    };

    fetchLikesAndUser();
  }, [post.id, supabase]);

  const handleToggleLike = async () => {
    if (!currentUserId) return;
    if (savingLike) return;

    setSavingLike(true);
    try {
      if (hasLiked) {
        // Quitar like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) {
          console.error("Error quitando like:", error);
        } else {
          setHasLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        // Añadir like
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) {
          console.error("Error añadiendo like:", error);
        } else {
          setHasLiked(true);
          setLikeCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error en handleToggleLike:", err);
    } finally {
      setSavingLike(false);
    }
  };

  const aiProbability = post.ai_probability ?? 0;
  const globalScore = post.global_score ?? 0;

  let aiLabel = "No analizado";
  if (aiProbability < 10) aiLabel = "Probabilidad IA muy baja";
  else if (aiProbability < 40) aiLabel = "Probabilidad IA baja";
  else if (aiProbability < 70) aiLabel = "Probabilidad IA media";
  else aiLabel = "Probabilidad IA alta";

  const createdAt = post.created_at
    ? new Date(post.created_at).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const firstLetter =
    authorName && authorName.trim().length > 0
      ? authorName.trim()[0].toUpperCase()
      : "E";

  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
      {/* Cabecera: avatar + nombre + fecha */}
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold">
            {firstLetter}
          </div>
          <div>
            <div className="text-sm font-medium">{authorName}</div>
            {createdAt && (
              <div className="text-xs text-neutral-500">{createdAt}</div>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-neutral-400">
          <div>Ethiqia Score</div>
          <div className="text-emerald-400 font-semibold">
            {globalScore}/100
          </div>
        </div>
      </header>

      {/* Imagen */}
      {post.image_url && (
        <div className="relative w-full overflow-hidden rounded-xl border border-neutral-800 bg-black mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption ?? "Publicación Ethiqia"}
            className="w-full object-cover max-h-[480px]"
          />
        </div>
      )}

      {/* Texto + score */}
      {(post.text || typeof post.ai_probability === "number") && (
        <div className="space-y-2 mb-3">
          {post.text && (
            <p className="text-sm text-neutral-100 whitespace-pre-line">
              {post.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full border border-neutral-700 bg-black px-2.5 py-1 text-[11px] text-neutral-300">
              Prob. IA:{" "}
              <span className="ml-1 font-semibold">
                {Math.round(aiProbability)}%
              </span>
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-600/60 px-2.5 py-1 text-[11px] text-emerald-300">
              {aiLabel}
            </span>
          </div>
        </div>
      )}

      {/* Barra de acciones: like, comentarios, guardar, compartir */}
      <footer className="flex items-center justify-between pt-2 border-t border-neutral-900 mt-2">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={savingLike || !currentUserId}
            className={`inline-flex items-center gap-1.5 ${
              hasLiked ? "text-emerald-400" : "text-neutral-400"
            } hover:text-emerald-300 disabled:opacity-60`}
          >
            <span className="text-base">♥</span>
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200"
          >
            <span className="text-base">💬</span>
            <span>Comentarios</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200"
          >
            <span className="text-base">🔖</span>
            <span>Guardar</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200"
          >
            <span className="text-base">↗</span>
            <span>Compartir</span>
          </button>
        </div>
      </footer>
    </article>
  );
}
