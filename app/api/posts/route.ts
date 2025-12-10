import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const supabase = supabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error cargando posts:", error);
    return NextResponse.json(
      { error: "Error al cargar posts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  const {
    userId,
    imageUrl,
    caption,
    aiProbability,
    globalScore,
    text,
    blocked,
    reason,
  } = body;

  if (!userId || !imageUrl) {
    return NextResponse.json(
      { error: "userId e imageUrl son obligatorios" },
      { status: 400 }
    );
  }

  // 1) Insertar el post real
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption,
      ai_probability: aiProbability,
      global_score: globalScore,
      text,
      blocked,
      reason,
      moderation_status: blocked ? "rejected" : "approved",
      moderation_decided_by: "ai-v1",
      moderation_decided_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("Error insertando post:", insertError);
    return NextResponse.json(
      { error: insertError.message },
      { status: 400 }
    );
  }

  // 2) Sumar puntos de transparencia (ej: 3 puntos por post auténtico)
  try {
    const value = blocked ? 0 : 3; // si el post se bloquea, no sumamos nada

    if (value > 0) {
      const { error: scoreError } = await supabase.from("scores").insert({
        user_id: userId,
        source: "TRANSPARENCY_POST",
        value,
        meta: { post_id: post.id },
      });

      if (scoreError) {
        console.error("Error insertando score:", scoreError);
        // NO rompemos la creación del post, solo registramos el fallo
      }
    }
  } catch (e) {
    console.error("Error inesperado insertando score:", e);
  }

  return NextResponse.json({ post });
}
