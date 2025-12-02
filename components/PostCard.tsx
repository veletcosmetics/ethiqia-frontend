"use client";

import React from "react";

export type Post = {
  id: string;
  authorName: string;
  createdAt: string;
  text?: string | null;
  imageUrl?: string | null;
  aiProbability?: number | null;
  globalScore?: number | null;
};

type PostCardProps = { post: Post };

function getAiLabel(prob: number | null | undefined) {
  const p = prob ?? 0;
  if (p >= 70) return "Alta probabilidad de IA";
  if (p >= 40) return "Probabilidad media de IA";
  return "Baja probabilidad de IA";
}

export default function PostCard({ post }: PostCardProps) {
  const aiProb = post.aiProbability ?? 0;
  const globalScore = post.globalScore ?? 0;

  const aiLabel = getAiLabel(aiProb);

  const aiPillClass =
    aiProb >= 70
      ? "bg-rose-900/60 text-rose-100 border border-rose-500/60"
      : aiProb >= 40
      ? "bg-amber-900/60 text-amber-100 border border-amber-500/60"
      : "bg-emerald-900/60 text-emerald-100 border border-emerald-500/60";

  return (
    <article className="max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-black/80 overflow-hidden mb-6">
      {/* Cabecera */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-200">
            {post.authorName ? post.authorName.charAt(0).toUpperCase() : "E"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-100">
              {post.authorName || "Usuario"}
            </span>
            <span className="text-[11px] text-gray-400">{post.createdAt}</span>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-[11px] font-medium ${aiPillClass}`}
        >
          {aiLabel}
        </div>
      </header>

      {/* Imagen */}
      {post.imageUrl && (
        <div className="w-full bg-black">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-auto object-contain bg-black"
          />
        </div>
      )}

      {/* Texto + score */}
      <div className="px-4 pt-3 pb-1">
        {post.text && (
          <p className="text-sm text-gray-100 whitespace-pre-wrap mb-2">
            {post.text}
          </p>
        )}

        <div className="space-y-1 text-[11px] text-gray-400 mb-2">
          <div className="flex items-center justify-between">
            <span>Ethiqia Score global</span>
            <span className="text-emerald-400 font-semibold">
              {globalScore}/100
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, Number(globalScore || 0))
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Acciones y caja de comentario (solo UI) */}
      <div className="px-4 pt-2 pb-3 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <span>♡</span>
              <span>Te gusta</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <span>💬</span>
              <span>Comentar</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <span>🔖</span>
              <span>Guardar</span>
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-white transition"
          >
            <span>↗</span>
            <span>Compartir</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un comentario respetuoso..."
            className="flex-1 rounded-full border border-zinc-700 bg-black px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            className="px-3 py-1.5 rounded-full bg-emerald-500 text-[11px] font-semibold text-black hover:bg-emerald-400 transition"
          >
            Publicar
          </button>
        </div>
      </div>
    </article>
  );
}
