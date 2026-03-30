"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

export type Post = {
  id: string;
  user_id: string;

  image_url?: string | null;
  caption?: string | null;
  created_at?: string | null;

  ai_probability?: number | null;
  global_score?: number | null;

  likes_count?: number | null;
  comments_count?: number | null;

  blocked?: boolean | null;
  reason?: string | null;

  liked_by_me?: boolean | null;

  [k: string]: any;
};

type Props = {
  post: Post;
  authorName?: string;
  authorAvatarUrl?: string;
  authorId?: string;
  onDelete?: (postId: string) => void;
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function HeartIcon({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 20s-7-4.6-9.2-8.5C.7 7.7 3.1 4.8 6.4 4.6c1.6-.1 3.1.6 4.1 1.8 1-1.2 2.5-1.9 4.1-1.8 3.3.2 5.7 3.1 3.6 6.9C19 15.4 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 14a6 6 0 01-6 6H8l-4 3V8a6 6 0 016-6h4a6 6 0 016 6v6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l4 4m-4-4L8 7m4-4v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PostCard({ post, authorName, authorAvatarUrl, authorId, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);

  const displayName = useMemo(() => (authorName || "").trim() || "Usuario Ethiqia", [authorName]);
  const authorLink = useMemo(() => {
    const id = (authorId || "").trim();
    return id ? `/u/${id}` : null;
  }, [authorId]);
  const created = formatDate(post.created_at);

  const imageUrl =
    (post.image_url as string | null | undefined) ??
    ((post as any).imageUrl as string | null | undefined) ??
    null;

  const initialLikes = Number(post.likes_count ?? (post as any).likes ?? 0) || 0;

  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likesUi, setLikesUi] = useState(initialLikes);
  const [commentsCount, setCommentsCount] = useState<number>(
    Number(post.comments_count ?? (post as any).comments ?? 0) || 0
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => { setLiked(Boolean(post.liked_by_me)); }, [post.liked_by_me]);
  useEffect(() => { setLikesUi(Number(post.likes_count ?? 0) || 0); }, [post.likes_count]);

  useEffect(() => {
    fetch(`/api/comments?postId=${post.id}&count=1`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.count === "number") setCommentsCount(d.count); })
      .catch(() => {});
  }, [post.id]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      return data.session?.access_token ?? null;
    } catch { return null; }
  }, []);

  const toggleLikeUi = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesUi((n) => (!wasLiked ? n + 1 : Math.max(0, n - 1)));
    try {
      const token = await getAccessToken();
      await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ postId: post.id, action: wasLiked ? "unlike" : "like" }),
      });
    } catch {
      setLiked(wasLiked);
      setLikesUi((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/p/${post.id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try { window.prompt("Copia este enlace:", url); } catch { /* no-op */ }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm("Seguro que quieres eliminar esta publicacion?")) return;
    setDeleting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) onDelete(post.id);
    } catch { /* no-op */ } finally { setDeleting(false); }
  };

  return (
    <article className="border-b border-neutral-800/60 hover:bg-neutral-900/30 transition-colors">
      <div className="flex gap-3 px-4 pt-3 pb-2.5">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {authorLink ? (
            <Link href={authorLink} className="block">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 border border-neutral-700/50 flex items-center justify-center">
                {authorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authorAvatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{(displayName[0] || "U").toUpperCase()}</span>
                )}
              </div>
            </Link>
          ) : (
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 border border-neutral-700/50 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{(displayName[0] || "U").toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Cabecera: nombre + fecha + delete */}
          <div className="flex items-center gap-1.5">
            {authorLink ? (
              <Link href={authorLink} className="text-sm font-semibold truncate hover:text-emerald-400 transition-colors">
                {displayName}
              </Link>
            ) : (
              <span className="text-sm font-semibold truncate">{displayName}</span>
            )}
            {created && <span className="text-neutral-500 text-xs shrink-0">· {created}</span>}
            {onDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="ml-auto text-neutral-600 hover:text-red-400 transition-colors p-1 rounded disabled:opacity-50"
                title="Eliminar"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Texto */}
          {post.caption && (
            <p className="text-sm text-neutral-200 mt-1 whitespace-pre-line leading-relaxed">{post.caption}</p>
          )}

          {/* Imagen compacta */}
          {imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-neutral-800/60 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={post.caption || "Publicacion"}
                className="w-full max-h-[280px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Blocked */}
          {post.blocked && (
            <div className="mt-2 text-xs rounded-lg border border-red-900/40 bg-red-500/10 px-3 py-2 text-red-200">
              Contenido rechazado.
              {post.reason && <span className="text-neutral-400 ml-1">({post.reason})</span>}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-5 mt-2 -ml-1.5">
            <button
              type="button"
              onClick={toggleLikeUi}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                liked ? "text-rose-400 hover:text-rose-300" : "text-neutral-500 hover:text-rose-400"
              }`}
              aria-label="Me gusta"
            >
              <HeartIcon className="h-[18px] w-[18px]" filled={liked} />
              {likesUi > 0 && <span>{likesUi}</span>}
            </button>

            <Link
              href={`/p/${post.id}`}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-500 hover:text-sky-400 transition-colors"
              aria-label="Comentar"
            >
              <ChatIcon className="h-[18px] w-[18px]" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                copied ? "text-emerald-400" : "text-neutral-500 hover:text-emerald-400"
              }`}
              aria-label="Compartir"
            >
              <ShareIcon className="h-[18px] w-[18px]" />
              {copied && <span>Copiado</span>}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
