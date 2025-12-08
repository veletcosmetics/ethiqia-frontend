import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET /api/posts  → devuelve todos los posts ordenados del más nuevo al más antiguo
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando posts:", error);
      return NextResponse.json(
        { error: "Error cargando posts", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado cargando posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts  → guarda un post real en la tabla `posts`
export async function POST(req: NextRequest) {
  try {
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

    // Validaciones mínimas
    if (!userId) {
      return NextResponse.json(
        { error: "Falta userId en el body" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Falta imageUrl en el body" },
        { status: 400 }
      );
    }

    const aiProb = typeof aiProbability === "number" ? aiProbability : 0;
    const gScore = typeof globalScore === "number" ? globalScore : 0;
    const isBlocked = Boolean(blocked);

    const moderationStatus = isBlocked ? "rejected" : "approved";

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        caption: caption ?? null,
        ai_probability: aiProb,
        global_score: gScore,
        text: text ?? null,
        blocked: isBlocked,
        reason: reason ?? null,

        // Campos de moderación según tu esquema actual
        moderation_status: moderationStatus,
        moderation_decided_at: new Date().toISOString(),
        moderation_decided_by: "ai-v1",
        // moderation_labels lo dejamos a null por ahora
        moderation_labels: null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error insertando post en Supabase:", error);
      return NextResponse.json(
        { error: "Error insertando post", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado guardando el post" },
      { status: 500 }
    );
  }
}
