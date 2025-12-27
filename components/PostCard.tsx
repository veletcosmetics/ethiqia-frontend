"use client";

import React, { useMemo } from "react";
import Link from "next/link";

export type Post = {
  id: string;
  user_id: string;
  image_url?: string | null;
  caption?: string | null;
  created_at?: string | null;

  // Moderación / scoring (opcionales según tu tabla)
  ai_probability?: number | null;
  global_score?: number | null;
  blocked?: boolean | null;
  reason?: string | null;

  // Permite campos extra sin romper TS
  [k: string]: any;
};

type Props = {
  post: Post;
  authorName?: string;
  authorAvatarUrl?: string;
  authorId?: string; // ✅ NUEVO: para linkar a /u/[id]
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

  // Si guardas ai_probability como 0..1 (lo normal en tu API), lo convertimos a %
  const aiProbPct = useMemo(() => {
    const v = typeof post.ai_probability === "number" ? post.ai_probability : null;
    if (v === null) return null;
    const pct = Math.round(clamp01(v) * 100);
    return pct;
  }, [post.ai_probability]);

  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header autor */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-neutral-900">
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

        {/* Meta derecha (suave, sin “ETHIQIA SCORE 100/100”) */}
        <div className="text-[11px] text-neutral-500 shrink-0">
          {aiProbPct !== null ? <>IA: {aiProbPct}%</> : null}
        </div>
      </div>

      {/* Imagen */}
      {post.image_url ? (
        <div className="relative bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption || "Publicación Ethiqia"}
            className="w-full max-h-[520px] object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="p-6 text-sm text-neutral-500">Sin imagen</div>
      )}

      {/* Caption + estado */}
      <div className="p-4 space-y-2">
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
    </article>
  );
}
