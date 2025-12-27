"use client";

import React from "react";

export type Post = {
  id: string;
  user_id: string;
  image_url?: string | null;
  caption?: string | null;
  created_at?: string | null;

  // Campos que pueden existir en tu tabla (no obligatorios)
  ai_probability?: number | null;
  global_score?: number | null;
  blocked?: boolean | null;
  reason?: string | null;
  moderation_status?: string | null;
};

export default function PostCard({
  post,
  authorName,
  authorAvatarUrl,
}: {
  post: Post;
  authorName?: string;
  authorAvatarUrl?: string | null;
}) {
  const name = (authorName || "Usuario Ethiqia").trim() || "Usuario Ethiqia";
  const created = post.created_at ? new Date(post.created_at) : null;

  return (
    <article className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
            {authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorAvatarUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {(name?.[0] || "U").toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-[11px] text-neutral-500">
              {created ? created.toLocaleString() : ""}
            </div>
          </div>
        </div>

        {/* IMPORTANTE:
            Aquí es donde antes solía ir el “ETHIQIA SCORE 100/100”.
            Lo hemos eliminado para que NO aparezca en el feed. */}
      </div>

      {/* Imagen */}
      {post.image_url ? (
        <div className="bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.caption ?? "Post"}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      {/* Caption */}
      {post.caption ? (
        <div className="px-4 py-4">
          <p className="text-sm text-neutral-200 whitespace-pre-line">
            {post.caption}
          </p>
        </div>
      ) : null}
    </article>
  );
}
