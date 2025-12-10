import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan variables de entorno de Supabase en el servidor");
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

type PostRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  moderation_status: string | null;
  moderation_reason: string | null;
  moderation_labels: any | null;
  moderation_decided_at: string | null;
  moderation_decided_by: string | null;
  ai_probability: number | null;
  global_score: number | null;
  text: string | null;
  blocked: boolean | null;
  reason: string | null;
};

type CreatePostBody = {
  userId: string;
  imageUrl: string;
  caption?: string;
  aiProbability?: number;
  globalScore?: number;
  text?: string;
  blocked?: boolean;
  reason?: string | null;
};

// GET: lista de posts para el feed
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo posts:", error);
      return NextResponse.json(
        { error: "Error obteniendo posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: (data ?? []) as PostRow[] });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado obteniendo posts" },
      { status: 500 }
    );
  }
}

// POST: crear post + sumar puntos de score
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreatePostBody;

    const {
      userId,
      imageUrl,
      caption,
      aiProbability = 0,
      globalScore = 0,
      text,
      blocked = false,
      reason,
    } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { error: "Faltan userId o imageUrl" },
        { status: 400 }
      );
    }

    const moderation_status = blocked ? "rejected" : "approved";

    // 1) Insertar el post real en la tabla posts
    const { data: insertedPost, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        caption,
        ai_probability: aiProbability,
        global_score: globalScore,
        text: text ?? caption ?? null,
        blocked,
        reason,
        moderation_status,
        moderation_reason: reason ?? null,
        moderation_decided_by: "ai-v1",
      })
      .select("*")
      .single();

    if (insertError || !insertedPost) {
      console.error("Error insertando post en Supabase:", insertError);
      return NextResponse.json(
        { error: "No se ha podido guardar el post" },
        { status: 500 }
      );
    }

    // 2) Insertar puntuación en scores (solo si NO está bloqueado)
    if (!blocked) {
      const { error: scoreError } = await supabase.from("scores").insert({
        user_id: userId,
        source: "TRANSPARENCY_POST", // se agrupa en el bloque de Transparencia
        value: 3, // alineado con score_rules.base_value
        meta: {
          post_id: insertedPost.id,
          ai_probability: aiProbability,
          from: "post_created",
        },
      });

      if (scoreError) {
        // No rompemos la creación del post, solo lo registramos en logs
        console.error("Error insertando score en Supabase:", scoreError);
      }
    }

    // 3) Devolver el post al frontend
    return NextResponse.json(
      { post: insertedPost as PostRow },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error al crear la publicación" },
      { status: 500 }
    );
  }
}
