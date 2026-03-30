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

  ai_probability?: number | null; // 0..1
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
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
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
      <path
        d="M20 14a6 6 0 01-6 6H8l-4 3V8a6 6 0 016-6h4a6 6 0 016 6v6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l4 4m-4-4L8 7m4-4v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PostCard({ post, authorName, authorAvatarUrl, authorId, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const displayName = useMemo(() => {
    const s = (authorName || "").trim();
    return s || "Usuario Ethiqia";
  }, [authorName]);

  const authorLink = useMemo(() => {
    const id = (authorId || "").trim();
    return id ? `/u/${id}` : null;
  }, [authorId]);

  const created = formatDate(post.created_at);

  const aiProbPct = useMemo(() => {
    const v = typeof post.ai_probability === "number" ? post.ai_probability : null;
    if (v === null) return null;
    return Math.round(clamp01(v) * 100);
  }, [post.ai_probability]);

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

  // Sincronizar si la prop cambia (e.g. al recargar datos)
  useEffect(() => {
    setLiked(Boolean(post.liked_by_me));
  }, [post.liked_by_me]);

  // Cargar conteo real de comentarios
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
    } catch {
      return null;
    }
  }, []);

  const toggleLikeUi = async () => {
    const wasLiked = liked;
    // Optimista
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
        body: JSON.stringify({
          postId: post.id,
          action: wasLiked ? "unlike" : "like",
        }),
      });
    } catch {
      // Revertir si falla
      setLiked(wasLiked);
      setLikesUi((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${post.id}` : "";

  const handleShare = async () => {
    try {
      const url = postUrl || `${window.location.origin}/feed`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt
      try {
        window.prompt("Copia este enlace:", postUrl);
      } catch { /* no-op */ }
    }
  };

  return (
    <article className="group rounded-2xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900 to-neutral-950 overflow-hidden transition-all hover:border-neutral-700/60 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Header autor */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-neutral-700/50 flex items-center justify-center shrink-0">
            {authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">
                {(displayName?.[0] || "U").toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            {authorLink ? (
              <Link href={authorLink} className="text-sm font-semibold truncate block hover:text-emerald-400 transition-colors">
                {displayName}
              </Link>
            ) : (
              <div className="text-sm font-semibold truncate">{displayName}</div>
            )}
            {created ? <div className="text-[11px] text-neutral-500 mt-0.5">{created}</div> : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {aiProbPct !== null && aiProbPct > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800/80 border border-neutral-700/50 px-2.5 py-1 text-[10px] text-neutral-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/80" />
              IA {aiProbPct}%
            </span>
          ) : null}
          {onDelete && (
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
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
                  if (res.ok) {
                    onDelete(post.id);
                  }
                } catch { /* no-op */ } finally {
                  setDeleting(false);
                }
              }}
              className="text-neutral-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-neutral-800/50 disabled:opacity-50"
              title="Eliminar publicacion"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Imagen */}
      {imageUrl ? (
        <div className="relative bg-black/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={post.caption || "Publicacion Ethiqia"}
            className="w-full max-h-[600px] object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      {/* Actions */}
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLikeUi}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                liked
                  ? "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                  : "text-neutral-300 hover:text-rose-400 hover:bg-neutral-800/50"
              }`}
              aria-label="Me gusta"
              title="Me gusta"
            >
              <HeartIcon className="h-5 w-5" filled={liked} />
              <span>{likesUi}</span>
            </button>

            <Link
              href={`/p/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-all"
              aria-label="Comentar"
              title="Comentar"
            >
              <ChatIcon className="h-5 w-5" />
              <span>{commentsCount}</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                copied
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
              }`}
              aria-label="Compartir"
              title="Compartir"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="hidden sm:inline">{copied ? "Copiado!" : "Compartir"}</span>
            </button>
          </div>

          <button
            type="button"
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800/50"
            aria-label="Guardar"
            title="Guardar"
          >
            <BookmarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Caption */}
        {post.caption ? (
          <div className="mt-3">
            <p className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
              {authorLink ? (
                <Link href={authorLink} className="font-semibold hover:text-emerald-400 mr-1.5 transition-colors">
                  {displayName}
                </Link>
              ) : (
                <span className="font-semibold mr-1.5">{displayName}</span>
              )}
              {post.caption}
            </p>
          </div>
        ) : null}

        {post.blocked ? (
          <div className="mt-3 text-xs rounded-xl border border-red-900/40 bg-red-500/10 p-3 text-red-200">
            Contenido marcado como rechazado.
            {post.reason ? (
              <div className="text-[11px] text-neutral-300 mt-1">Motivo: {post.reason}</div>
            ) : null}
          </div>
        ) : null}

        {/* Link a comentarios */}
        {commentsCount > 0 ? (
          <Link
            href={`/p/${post.id}`}
            className="block mt-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Ver los {commentsCount} comentarios
          </Link>
        ) : null}
      </div>
    </article>
  );
}
