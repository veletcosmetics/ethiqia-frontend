"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  authorId?: string;
  authorAvatarUrl?: string | null;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
};

export default function PostCard({ post, authorName, authorId, authorAvatarUrl }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Likes
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

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

  const { aiLabel, aiColor } = useMemo(() => {
    let label = "Prob. IA: baja";
    let color = "bg-emerald-600";
    if (aiProb >= 70) {
      label = "Prob. IA: muy alta";
      color = "bg-red-600";
    } else if (aiProb >= 40) {
      label = "Prob. IA: media";
      color = "bg-yellow-500";
    }
    return { aiLabel: label, aiColor: color };
  }, [aiProb]);

  // ---------- Likes: cargar estado inicial ----------
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        // count
        const { count, error: countErr } = await supabaseBrowser
          .from("post_likes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.id);

        if (!countErr) setLikesCount(Number(count ?? 0));

        // liked by me
        if (user) {
          const { data: mine, error: mineErr } = await supabaseBrowser
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!mineErr) setLiked(Boolean(mine?.id));
        } else {
          setLiked(false);
        }
      } catch (e) {
        console.warn("Likes init error:", e);
      }
    };

    loadLikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        alert("Debes iniciar sesión para dar Me gusta.");
        return;
      }

      if (liked) {
        const { error } = await supabaseBrowser
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error quitando like:", error);
          return;
        }

        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await supabaseBrowser.from("post_likes").insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (error) {
          console.error("Error dando like:", error);
          return;
        }

        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } finally {
      setLiking(false);
    }
  };

  // ---------- Comentarios ----------
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabaseBrowser
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
    if (next && comments.length === 0) await fetchComments();
  };

  const handleSendComment = async () => {
    const content = newComment.trim();
    if (!content) return;

    setSendingComment(true);
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        alert("Debes iniciar sesión para comentar.");
        return;
      }

      const { data, error } = await supabaseBrowser
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
      <header className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {authorAvatarUrl ? (
            // <img> para evitar config de next/image con dominios remotos
            <img
              src={authorAvatarUrl}
              alt={authorName}
              className="h-10 w-10 rounded-full object-cover border border-neutral-700"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold">
              {(authorName?.[0] ?? "U").toUpperCase()}
            </div>
          )}

          <div>
            {authorId ? (
              <Link href={`/u/${authorId}`} className="text-sm font-semibold hover:text-emerald-400">
                {authorName}
              </Link>
            ) : (
              <div className="text-sm font-semibold">{authorName}</div>
            )}
            <div className="text-xs text-neutral-400">{formattedDate}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-neutral-400">Ethiqia Score</div>
          <div className="text-emerald-400 text-sm font-semibold">{score}/100</div>
        </div>
      </header>

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

      {post.caption && (
        <p className="mt-3 text-sm text-neutral-100 whitespace-pre-line">{post.caption}</p>
      )}

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

      {/* Botones */}
      <div className="mt-4 flex items-center gap-5 text-xs text-neutral-400">
        <button
          type="button"
          onClick={toggleLike}
          disabled={liking}
          className={`flex items-center gap-2 transition-colors ${
            liked ? "text-emerald-400" : "hover:text-emerald-400"
          }`}
        >
          <span>{liked ? "❤️" : "🤍"}</span>
          <span>{likesCount}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
        >
          <span>💬</span>
          <span>Comentarios{comments.length > 0 ? ` (${comments.length})` : ""}</span>
        </button>
      </div>

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
                const created = comment.created_at ? new Date(comment.created_at) : null;
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
                      <span className="font-medium text-neutral-100">Usuario Ethiqia</span>
                      {createdLabel && (
                        <span className="text-[10px] text-neutral-500">{createdLabel}</span>
                      )}
                    </div>
                    <p className="mt-1 text-neutral-100">{comment.content}</p>
                  </li>
                );
              })}
            </ul>
          )}

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
