"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 🔹 Exportamos el tipo Post para que app/feed/page.tsx pueda usarlo
export type Post = {
  id: string;
  user_id: string | null;
  created_at: string;
  text: string | null;
  image_url: string | null;
  ai_probability: number | null;
  global_score: number | null;
  blocked: boolean | null;
  reason: string | null;
};

type Props = {
  post: Post;
};

export default function PostCard({ post }: Props) {
  const [authorName, setAuthorName] = useState("Usuario demo");
  const [loadingAuthor, setLoadingAuthor] = useState<boolean>(!!post.user_id);

  useEffect(() => {
    const loadAuthor = async () => {
      if (!post.user_id) {
        setLoadingAuthor(false);
        return;
      }

      setLoadingAuthor(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", post.user_id)
        .maybeSingle();

      if (error) {
        console.error("Error cargando autor:", error);
        setLoadingAuthor(false);
        return;
      }

      if (data?.full_name) {
        setAuthorName(data.full_name);
      }

      setLoadingAuthor(false);
    };

    loadAuthor();
  }, [post.user_id]);

  const formattedDate = new Date(post.created_at).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const aiProbability = post.ai_probability ?? 0;
  const globalScore =
    post.global_score ?? Math.max(0, Math.min(100, Math.round(100 - aiProbability)));

  const isBlocked = post.blocked ?? false;
  const reason = post.reason ?? null;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      {/* Cabecera: autor + fecha */}
      <header className="px-4 py-3 flex items-center justify-between gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Avatar simple */}
          <div className="h-9 w-9 rounded-full bg-emerald-500/90 flex items-center justify-center text-black text-sm font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-50">
              {loadingAuthor ? "Cargando..." : authorName}
            </span>
            <span className="text-xs text-zinc-500">{formattedDate}</span>
          </div>
        </div>
      </header>

      {/* Imagen */}
      {post.image_url && (
        <div className="w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.text ?? "Publicación"}
            className="w-full max-h-[480px] object-contain bg-black"
          />
        </div>
      )}

      {/* Texto + info IA */}
      <div className="px-4 py-3 space-y-3">
        {post.text && (
          <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
            {post.text}
          </p>
        )}

        {/* Datos de IA / autenticidad */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-emerald-500/60 bg-emerald-900/20 px-3 py-1 text-emerald-200">
            Score autenticidad:{" "}
            <span className="font-semibold">{globalScore.toFixed(0)} / 100</span>
          </span>

          <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-zinc-300">
            Prob. IA:{" "}
            <span className="font-semibold">
              {aiProbability.toFixed(1).replace(".", ",")}%
            </span>
          </span>

          {isBlocked && (
            <span className="rounded-full border border-red-500/70 bg-red-900/30 px-3 py-1 text-red-200">
              Contenido limitado por moderación
            </span>
          )}
        </div>

        {/* Motivo de moderación si existe */}
        {reason && (
          <div className="mt-1 rounded-xl border border-amber-500/40 bg-amber-900/20 px-3 py-2 text-[11px] text-amber-100">
            Motivo moderación: {reason}
          </div>
        )}
      </div>
    </article>
  );
}
