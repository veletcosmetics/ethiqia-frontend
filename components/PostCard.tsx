"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  repost_of?: string | null;
  repost_author_name?: string | null;
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
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [reposting, setReposting] = useState(false);
  const [repostMsg, setRepostMsg] = useState<string | null>(null);

  // Load original post for reposts
  const [originalPost, setOriginalPost] = useState<{ caption?: string | null; image_url?: string | null; author_name?: string; created_at?: string | null } | null>(null);

  useEffect(() => {
    if (!post.repost_of) return;
    const loadOriginal = async () => {
      try {
        const { data, error } = await supabaseBrowser
          .from("posts")
          .select("caption, image_url, user_id, created_at")
          .eq("id", post.repost_of!)
          .maybeSingle();
        if (!error && data) {
          let authorName = "Usuario";
          try {
            const { data: prof } = await supabaseBrowser
              .from("profiles")
              .select("full_name")
              .eq("id", data.user_id)
              .maybeSingle();
            if (prof?.full_name) authorName = prof.full_name;
          } catch { /* no-op */ }
          setOriginalPost({ ...data, author_name: authorName });
        }
      } catch { /* no-op */ }
    };
    loadOriginal();
  }, [post.repost_of]);

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

  // Cerrar dropdown share al click fuera
  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [shareOpen]);

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

  const getPostUrl = () => typeof window !== "undefined" ? `${window.location.origin}/p/${post.id}` : "";
  const shareTitle = post.caption?.slice(0, 80) || "Post en Ethiqia";

  const handleShare = () => {
    setShareOpen((prev) => !prev);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl());
      setCopied(true);
      setShareOpen(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try { window.prompt("Copia este enlace:", getPostUrl()); } catch { /* no-op */ }
    }
  };

  const shareToTwitter = () => {
    const url = getPostUrl();
    const text = encodeURIComponent(post.caption?.slice(0, 200) || "Mira esto en Ethiqia");
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank", "noopener");
    setShareOpen(false);
  };

  const shareToWhatsApp = () => {
    const url = getPostUrl();
    const text = encodeURIComponent(`${post.caption?.slice(0, 200) || "Mira esto en Ethiqia"} ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    setShareOpen(false);
  };

  const shareToLinkedIn = () => {
    const url = getPostUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener");
    setShareOpen(false);
  };

  const openRepostModal = () => {
    setShareOpen(false);
    setRepostText("");
    setRepostMsg(null);
    setRepostModalOpen(true);
  };

  const submitRepost = async () => {
    setReposting(true);
    setRepostMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) { setRepostMsg("Inicia sesion para repostear."); return; }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          caption: repostText || null,
          repostOf: post.id,
          aiProbability: 0,
          globalScore: 100,
          blocked: false,
        }),
      });
      if (res.ok) {
        setRepostMsg("Reposteado!");
        setTimeout(() => { setRepostModalOpen(false); setRepostMsg(null); }, 1500);
      } else {
        const json = await res.json().catch(() => ({}));
        setRepostMsg(json.error ?? "Error al repostear");
      }
    } catch { setRepostMsg("Error al repostear"); }
    finally { setReposting(false); }
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
      {/* Repost label + original post */}
      {post.repost_of && (
        <div className="px-4 pt-2.5 pb-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-2">
            <span>&#128257;</span>
            <span>{post.repost_author_name ?? authorName} reposteo</span>
          </div>
          {/* Caption del repost (comentario del usuario) */}
          {post.caption && <p className="text-xs text-neutral-300 mb-2">{post.caption}</p>}
          {/* Post original embebido */}
          {originalPost && (
            <Link href={`/p/${post.repost_of}`} className="block rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden mb-2 hover:border-neutral-700 transition-colors">
              {originalPost.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={originalPost.image_url} alt="" className="w-full max-h-[200px] object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-neutral-300">{originalPost.author_name}</span>
                  {originalPost.created_at && (
                    <span className="text-[10px] text-neutral-600">· {formatDate(originalPost.created_at)}</span>
                  )}
                </div>
                {originalPost.caption && <p className="text-xs text-neutral-400 line-clamp-3">{originalPost.caption}</p>}
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Imagen (solo para posts normales, no reposts) */}
      {!post.repost_of && imageUrl && (
        <Link href={`/p/${post.id}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={post.caption || "Publicacion"} className="w-full max-h-[320px] object-contain bg-black" loading="lazy" />
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

          <div className="relative" ref={shareRef}>
            <button type="button" onClick={handleShare}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${copied ? "text-emerald-400" : shareOpen ? "text-emerald-400 bg-neutral-800/50" : "text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800/50"}`}
              aria-label="Compartir">
              <ShareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{copied ? "Enlace copiado!" : "Compartir"}</span>
            </button>

            {shareOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-neutral-700/60 bg-neutral-900 shadow-xl shadow-black/40 overflow-hidden z-20">
                <button type="button" onClick={openRepostModal} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 transition-colors border-b border-neutral-800/50">
                  <span className="text-sm shrink-0">&#128257;</span>
                  Repostear en Ethiqia
                </button>
                <button type="button" onClick={copyLink} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <svg className="h-4 w-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/></svg>
                  Copiar enlace
                </button>
                <button type="button" onClick={shareToTwitter} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <svg className="h-4 w-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter / X
                </button>
                <button type="button" onClick={shareToWhatsApp} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <svg className="h-4 w-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button type="button" onClick={shareToLinkedIn} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <svg className="h-4 w-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
              </div>
            )}
          </div>
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
      {/* Modal repost */}
      {repostModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRepostModalOpen(false)}>
          <div className="bg-neutral-900 border border-neutral-700/60 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-neutral-800/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Repostear en Ethiqia</h3>
              <button type="button" onClick={() => setRepostModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                rows={2}
                placeholder="Anade tu comentario... (opcional)"
                value={repostText}
                onChange={(e) => setRepostText(e.target.value)}
              />

              {/* Preview del post original */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="w-full h-32 object-cover" />
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
                      {authorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={authorAvatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-bold text-white">{(displayName[0] || "U").toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-300">{displayName}</span>
                  </div>
                  {post.caption && <p className="text-xs text-neutral-400 line-clamp-2">{post.caption}</p>}
                </div>
              </div>

              {repostMsg && (
                <p className={`text-xs ${repostMsg === "Reposteado!" ? "text-emerald-400" : "text-red-400"}`}>{repostMsg}</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-end gap-2">
              <button type="button" onClick={() => setRepostModalOpen(false)} className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitRepost}
                disabled={reposting}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              >
                {reposting ? "Reposteando..." : "Repostear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
