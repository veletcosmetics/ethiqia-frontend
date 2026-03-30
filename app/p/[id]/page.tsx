"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PostCard, { Post } from "@/components/PostCard";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>("Usuario Ethiqia");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      setToken(data.session?.access_token ?? null);
      setCurrentUserId(data.session?.user?.id ?? null);
    };
    init();
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadPost = async () => {
      setLoadingPost(true);
      try {
        const { data, error } = await supabaseBrowser
          .from("posts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error || !data) { setPost(null); return; }
        setPost(data as Post);

        if (data.user_id) {
          const { data: profile } = await supabaseBrowser
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", data.user_id)
            .maybeSingle();
          if (profile?.full_name) setAuthorName(profile.full_name);
          if (profile?.avatar_url) setAuthorAvatar(profile.avatar_url);
        }
      } finally {
        setLoadingPost(false);
      }
    };
    loadPost();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/comments?postId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments ?? []);
        }
      } finally {
        setLoadingComments(false);
      }
    };
    loadComments();
  }, [id]);

  const handleDelete = async (commentId: string) => {
    if (!token) return;
    setDeletingId(commentId);
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // silencioso
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageIsError(false);

    if (!token) {
      setMessageIsError(true);
      setMessage("Debes iniciar sesión para comentar.");
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: id, text: commentText }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Mostrar razon de moderacion si viene
        const reason = json.reason ? `\n${json.reason}` : "";
        throw new Error((json.error ?? "Error al enviar comentario") + reason);
      }

      setComments((prev) => [...prev, json.comment]);
      setCommentText("");
      setMessage("Comentario publicado.");
    } catch (err: any) {
      setMessageIsError(true);
      setMessage(err.message ?? "Error al enviar el comentario.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPost) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Cargando publicación…</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-zinc-400">Publicación no encontrada.</p>
          <Link href="/feed" className="text-xs text-emerald-400 hover:underline">← Volver al feed</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href="/feed" className="text-xs text-zinc-400 hover:text-emerald-400">← Volver al feed</Link>

        <PostCard post={post} authorName={authorName} authorId={post.user_id} authorAvatarUrl={authorAvatar ?? undefined} />

        {/* Comentarios */}
        <div className="rounded-2xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900 to-neutral-950 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-800/60">
            <h2 className="text-sm font-semibold">
              Comentarios
              {comments.length > 0 && (
                <span className="text-neutral-500 font-normal ml-1.5">({comments.length})</span>
              )}
            </h2>
          </div>

          <div className="px-5 py-4 space-y-4">
            {loadingComments ? (
              <div className="flex items-center gap-3 py-4 text-neutral-400">
                <div className="w-4 h-4 border-2 border-neutral-600 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-xs">Cargando comentarios...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2">Se el primero en comentar.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center shrink-0 mt-0.5">
                      {c.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {(c.profiles?.full_name?.[0] ?? "U").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-200">
                          {c.profiles?.full_name ?? "Usuario Ethiqia"}
                        </span>
                        <span className="text-[10px] text-neutral-600">{formatDate(c.created_at)}</span>
                        {currentUserId && c.user_id === currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="ml-auto text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Borrar comentario"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-neutral-300 whitespace-pre-line mt-0.5">{c.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulario nuevo comentario */}
          <div className="px-5 py-4 border-t border-neutral-800/60 bg-neutral-950/50">
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                rows={2}
                placeholder={token ? "Escribe un comentario..." : "Inicia sesion para comentar"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!token}
              />

              {message && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs ${
                    messageIsError
                      ? "bg-red-500/10 border border-red-900/30 text-red-300"
                      : "bg-emerald-500/10 border border-emerald-900/30 text-emerald-300"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !token || !commentText.trim()}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? "Enviando..." : "Comentar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
