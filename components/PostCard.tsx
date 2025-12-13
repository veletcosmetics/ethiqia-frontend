"use client";

import React, { useMemo, useState } from "react";
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

  // NUEVO: viene de /api/posts GET (merge)
  author_full_name?: string | null;

  // compatibilidad por si existiera join antiguo
  profiles?: { full_name: string | null } | null;
};

type Props = {
  post: Post;
  authorName?: string;
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

  const realAuthor = useMemo(() => {
    const a = post.author_full_name?.trim();
    if (a) return a;

    const b = post.profiles?.full_name?.trim();
    if (b) return b;

    const c = authorName?.trim();
    if (c) return c;

    return "Usuario Ethiqia";
  }, [post.author_full_name, post.profiles?.full_name, authorName]);

  const initial = useMemo(() => {
    const s = (realAuthor || "U").trim();
    return (s[0] || "U").toUpperCase();
  }, [realAuthor]);

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

      if (authError || !user) {
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

  return (
    <article className="bg-neutral-900 rounded-2xl p-4 sm:p-5 mb-4 border border-neutral-800">
      <header className="flex justify-between items-start gap-3">
        <Link href={`/u/${post.user_id}`} className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
          <div>
            <div className="text-sm font-semibold group-hover:text-emerald-400 transition-colors">
              {realAuthor}
            </div>
            <div className="text-xs text-neutral-400">{formattedDate}</div>
          </div>
        </Link>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-neutral-400">
            Ethiqia Score
          </div>
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
        <p className="mt-3 text-sm text-neutral-100 whitespace-pre-line">
          {post.caption}
        </p>
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

      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
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
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="text-xs bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2"
                >
                  <p className="text-neutral-100">{comment.content}</p>
                </li>
              ))}
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
