"use client";

import React from "react";

type PostStats = {
  globalScore: number;      // 0–100
  authenticity: number;     // 0–100
  aiProbability: number;    // 0–100
  coherence: number;        // 0–100
};

export type Post = {
  id: string;
  authorName: string;
  authorUsername?: string;
  createdAt: string;        // ya formateado o ISO
  imageUrl?: string | null;
  text?: string;
  stats?: PostStats;
  likes?: number;
  commentsCount?: number;
  saved?: boolean;
};

interface PostCardProps {
  post: Post;
}

function ScoreBar({
  label,
  value,
  extra,
  barClass,
}: {
  label: string;
  value: number;
  extra?: string;
  barClass: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-gray-300">
        <span>{label}</span>
        <span className="font-medium">
          {safeValue}%
          {extra ? <span className="text-gray-400"> · {extra}</span> : null}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const {
    authorName,
    authorUsername,
    createdAt,
    imageUrl,
    text,
    stats,
    likes = 0,
    commentsCount = 0,
    saved = false,
  } = post;

  const aiProb = stats?.aiProbability ?? 0;
  const aiLabel =
    aiProb >= 70 ? "Alta probabilidad de IA" :
    aiProb >= 40 ? "Prob. media de IA" :
    "Baja probabilidad de IA";

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
            {authorName ? authorName.charAt(0).toUpperCase() : "E"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-100">
              {authorName || "Usuario demo"}
            </span>
            <span className="text-[11px] text-gray-400">
              {createdAt}
              {authorUsername ? ` · @${authorUsername}` : null}
            </span>
          </div>
        </div>

        {stats && (
          <div
            className={`px-3 py-1 rounded-full text-[11px] font-medium ${aiPillClass}`}
          >
            {aiLabel}
          </div>
        )}
      </header>

      {/* Imagen */}
      {imageUrl && (
        <div className="w-full bg-black">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-auto object-contain bg-black"
          />
        </div>
      }

      {/* Texto + score */}
      {(text || stats) && (
        <div className="px-4 pt-3 pb-1">
          {text && (
            <p className="text-sm text-gray-100 whitespace-pre-wrap mb-2">
              {text}
            </p>
          )}

          {stats && (
            <div className="space-y-1 text-[11px] text-gray-400 mb-2">
              <div className="flex items-center justify-between">
                <span>Ethiqia Score global</span>
                <span className="text-emerald-400 font-semibold">
                  {stats.globalScore}/100
                </span>
              </div>

              <div className="space-y-2 mt-1">
                <ScoreBar
                  label="Autenticidad"
                  value={stats.authenticity}
                  extra="Prob. IA"
                  barClass="bg-emerald-500"
                />
                <ScoreBar
                  label="Prob. IA"
                  value={stats.aiProbability}
                  barClass="bg-amber-400"
                />
                <ScoreBar
                  label="Coherencia"
                  value={stats.coherence}
                  barClass="bg-sky-400"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
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
              <span>{saved ? "Guardado" : "Guardar"}</span>
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

        <div className="text-[11px] text-gray-500 mb-2">
          <span>{likes} me gusta</span>
          <span className="mx-1">·</span>
          <span>{commentsCount} comentarios</span>
        </div>

        {/* Caja de comentario */}
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
