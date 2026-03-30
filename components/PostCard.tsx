"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
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
      <path d="M12 20s-7-4.6-9.2-8.5C.7 7.7 3.1 4.8 6.4 4.6c1.6-.1 3.1.6 4.1 1.8 1-1.2 2.5-1.9 4.1-1.8 3.3.2 5.7 3.1 3.6 6.9C19 15.4 12 20 12 20z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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

  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likesUi, setLikesUi] = useState(Number(post.likes_count ?? 0) || 0);
  const [commentsCount, setCommentsCount] = useState<number>(Number(post.comments_count ?? 0) || 0);
  const [copied, setCopied] = useState(false);

  // Inline comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentMsg, setCommentMsg] = useState<{ text: string; error: boolean } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Load comments when panel opens
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?postId=${post.id}`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.comments ?? []);
        setCommentsCount((json.comments ?? []).length);
      }
    } catch { /* no-op */ }
    finally {
      setLoadingComments(false);
      setCommentsFetched(true);
    }
  }, [post.id]);

  const toggleComments = () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !commentsFetched) {
      loadComments();
    }
    if (next) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    setCommentMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setCommentMsg({ text: "Inicia sesion para comentar.", error: true });
        return;
      }
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: post.id, text: commentText }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = json.reason ? `\n${json.reason}` : "";
        setCommentMsg({ text: (json.error ?? "Error al enviar") + reason, error: true });
        return;
      }
      setComments((prev) => [...prev, json.comment]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
      setCommentMsg({ text: "Comentario publicado.", error: false });
      setTimeout(() => setCommentMsg(null), 3000);
    } catch {
      setCommentMsg({ text: "Error al enviar el comentario.", error: true });
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleLikeUi = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesUi((n) => (!wasLiked ? n + 1 : Math.max(0, n - 1)));
    try {
      const token = await getAccessToken();
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) onDelete(post.id);
    } catch { /* no-op */ } finally { setDeleting(false); }
  };

  return (
    <article className="rounded-2xl bg-neutral-900/80 border border-neutral-800/50 shadow-md shadow-black/20 overflow-hidden flex flex-col transition-all hover:border-neutral-700/50 hover:shadow-lg hover:shadow-black/30">
      {/* Imagen */}
      {imageUrl && (
        <Link href={`/p/${post.id}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={post.caption || "Publicacion"} className="w-full h-[210px] object-cover" loading="lazy" />
        </Link>
      )}

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
            {authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-white">{(displayName[0] || "U").toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {authorLink ? (
              <Link href={authorLink} className="text-xs font-semibold truncate block hover:text-emerald-400 transition-colors">{displayName}</Link>
            ) : (
              <span className="text-xs font-semibold truncate block">{displayName}</span>
            )}
          </div>
          {created && <span className="text-[11px] text-neutral-500 shrink-0">{created}</span>}
          {onDelete && (
            <button type="button" disabled={deleting} onClick={handleDelete} className="text-neutral-600 hover:text-red-400 transition-colors p-0.5 rounded disabled:opacity-50 shrink-0" title="Eliminar">
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Caption */}
        {post.caption && <p className="text-[13px] text-neutral-300 leading-snug mb-3 line-clamp-3">{post.caption}</p>}
        {!imageUrl && !post.caption && <p className="text-xs text-neutral-600 mb-3">Sin contenido</p>}

        {/* Blocked */}
        {post.blocked && (
          <div className="text-[11px] rounded-lg border border-red-900/40 bg-red-500/10 px-2.5 py-1.5 text-red-300 mb-3">
            Rechazado{post.reason && <span className="text-neutral-400"> — {post.reason}</span>}
          </div>
        )}

        <div className="flex-1" />

        {/* Acciones */}
        <div className="flex items-center justify-between pt-2.5 border-t border-neutral-800/40">
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleLikeUi}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${liked ? "text-rose-400 bg-rose-500/10" : "text-neutral-500 hover:text-rose-400 hover:bg-neutral-800/50"}`}
              aria-label="Me gusta">
              <HeartIcon className="h-4 w-4" filled={liked} />
              {likesUi > 0 && <span>{likesUi}</span>}
            </button>

            <button type="button" onClick={toggleComments}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${commentsOpen ? "text-sky-400 bg-sky-500/10" : "text-neutral-500 hover:text-sky-400 hover:bg-neutral-800/50"}`}
              aria-label="Comentar">
              <ChatIcon className="h-4 w-4" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>
          </div>

          <button type="button" onClick={handleShare}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${copied ? "text-emerald-400" : "text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800/50"}`}
            aria-label="Compartir">
            <ShareIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{copied ? "Copiado" : "Compartir"}</span>
          </button>
        </div>
      </div>

      {/* Panel de comentarios inline */}
      {commentsOpen && (
        <div className="border-t border-neutral-800/40 bg-neutral-950/50">
          <div className="px-4 py-3 max-h-[280px] overflow-y-auto space-y-2.5">
            {loadingComments && (
              <div className="flex items-center gap-2 py-2 text-neutral-500">
                <div className="w-3.5 h-3.5 border-2 border-neutral-700 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-xs">Cargando...</span>
              </div>
            )}

            {!loadingComments && commentsFetched && comments.length === 0 && (
              <p className="text-xs text-neutral-600 py-1">Se el primero en comentar.</p>
            )}

            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="h-5 w-5 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                  {c.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-bold">{(c.profiles?.full_name?.[0] ?? "U").toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-neutral-300">{c.profiles?.full_name ?? "Usuario"}</span>
                  <span className="text-[10px] text-neutral-600 ml-1.5">{formatDate(c.created_at)}</span>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input nuevo comentario */}
          <div className="px-4 pb-3 pt-1">
            {commentMsg && (
              <p className={`text-[11px] mb-1.5 ${commentMsg.error ? "text-red-400" : "text-emerald-400"}`}>
                {commentMsg.text}
              </p>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                rows={1}
                placeholder="Escribe un comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={submittingComment || !commentText.trim()}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition-colors shrink-0"
              >
                {submittingComment ? "..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
