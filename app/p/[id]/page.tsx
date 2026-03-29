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
  text: string;
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
  const [authorName, setAuthorName] = useState<string>("Usuario Ethiqia");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      setToken(data.session?.access_token ?? null);
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
            .select("full_name")
            .eq("id", data.user_id)
            .maybeSingle();
          if (profile?.full_name) setAuthorName(profile.full_name);
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al enviar comentario");
      }

      const { comment } = await res.json();
      setComments((prev) => [...prev, comment]);
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

        <PostCard post={post} authorName={authorName} authorId={post.user_id} />

        {/* Comentarios */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Comentarios</h2>

          {loadingComments ? (
            <p className="text-xs text-zinc-500">Cargando comentarios…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-zinc-500">Sé el primero en comentar.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      {c.profiles?.full_name ?? "Usuario Ethiqia"}
                    </span>
                    <span className="text-[11px] text-zinc-600">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-line">{c.text}</p>
                </li>
              ))}
            </ul>
          )}

          {/* Formulario nuevo comentario */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <textarea
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={3}
              placeholder={token ? "Escribe un comentario…" : "Inicia sesión para comentar"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!token}
            />

            {message && (
              <p className={`text-xs ${messageIsError ? "text-red-400" : "text-emerald-400"}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !token || !commentText.trim()}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Comentar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
