"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

export type Post = {
  id: string;
  user_id: string;

  image_url?: string | null;
  caption?: string | null;
  created_at?: string | null;

  // Moderación / scoring (opcionales según tu tabla)
  ai_probability?: number | null; // 0..1
  global_score?: number | null;

  // Contadores (si existen en tu SELECT)
  likes_count?: number | null;
  comments_count?: number | null;

  // Flags opcionales
  blocked?: boolean | null;
  reason?: string | null;

  // Permite campos extra sin romper TS
  [k: string]: any;
};

type Props = {
  post: Post;
  authorName?: string;
  authorAvatarUrl?: string;
  authorId?: string; // para link a /u/[id]
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function PostCard({ post, authorName, authorAvatarUrl, authorId }: Props) {
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

  // Contadores “seguros”
  const initialLikes = Number(post.likes_count ?? (post as any).likes ?? 0) || 0;
  const initialComments = Number(post.comments_count ?? (post as any).comments ?? 0) || 0;

  // UI local (no rompe aunque no exista backend)
  const [liked, setLiked] = useState(false);
  const [likesUi, setLikesUi] = useState(initialLikes);

  const toggleLikeUi = () => {
    // Solo UI. Si luego quieres persistir, aquí conectamos a /api/likes o lo que uses.
    setLiked((prev) => {
      const next = !prev;
      setLikesUi((n) => (next ? n + 1 : Math.max(0, n - 1)));
      return next;
    });
  };

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header autor */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-900">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
            {authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{(displayName?.[0] || "U").toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0">
            {authorLink ? (
              <Link href={authorLink} className="text-sm font-semibold truncate hover:text-emerald-400">
                {displayName}
              </Link>
            ) : (
              <div className="text-sm font-semibold truncate">{displayName}</div>
            )}

            {created ? <div className="text-[11px] text-neutral-500">{created}</div> : null}
          </div>
        </div>

        {/* Derecha: IA% (discreto) */}
        <div className="text-[11px] text-neutral-500 shrink-0">{aiProbPct !== null ? <>IA: {aiProbPct}%</> : null}</div>
      </div>

      {/* Imagen */}
      {imageUrl ? (
        <div className="relative bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={post.caption || "Publicación Ethiqia"}
            className="w-full max-h-[560px] object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="p-6 text-sm text-neutral-500">Sin imagen</div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLikeUi}
              className={`inline-flex items-center gap-2 text-xs font-semibold ${
                liked ? "text-emerald-400" : "text-neutral-200 hover:text-white"
              }`}
              aria-label="Me gusta"
              title="Me gusta"
            >
              <HeartIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Me gusta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Si ya tienes modal de comentarios, lo conectamos aquí.
                // Por ahora: no rompe y mantiene la UI.
                alert("Comentarios: pendiente de conectar a tu sistema real.");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-200 hover:text-white"
              aria-label="Comentar"
              title="Comentar"
            >
              <ChatIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Comentar</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/feed`);
                  // Si luego tienes URL real por post, lo cambiamos a /p/{id}
                } catch {}
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-200 hover:text-white"
              aria-label="Compartir"
              title="Compartir"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
          </div>

          {/* Contadores a la derecha */}
          <div className="text-[11px] text-neutral-500 flex items-center gap-3">
            <span>
              <span className="text-neutral-200 font-semibold">{likesUi}</span> me gusta
            </span>
            <span>
              <span className="text-neutral-200 font-semibold">{initialComments}</span> comentarios
            </span>
          </div>
        </div>

        {/* Caption */}
        <div className="mt-3 space-y-2">
          {post.caption ? (
            <div className="text-sm text-neutral-200 whitespace-pre-line">{post.caption}</div>
          ) : (
            <div className="text-sm text-neutral-500">Sin descripción</div>
          )}

          {post.blocked ? (
            <div className="text-xs rounded-xl border border-red-900/40 bg-red-500/10 p-3 text-red-200">
              Contenido marcado como rechazado.
              {post.reason ? <div className="text-[11px] text-neutral-300 mt-1">Motivo: {post.reason}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
