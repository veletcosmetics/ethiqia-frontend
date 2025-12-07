// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando posts:", error);
      return NextResponse.json(
        { error: "Error cargando posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      imageUrl,
      caption,
      text,
      aiProbability,
      globalScore,
      blocked,
      reason,
    } = body as {
      userId: string;
      imageUrl: string;
      caption: string;
      text: string;
      aiProbability: number;
      globalScore: number;
      blocked: boolean;
      reason: string | null;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "Falta userId" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Falta imageUrl (URL pública de la imagen)" },
        { status: 400 }
      );
    }

    const moderationStatus = blocked ? "rejected" : "approved";

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: imageUrl,        // ← AQUÍ GUARDAMOS LA URL
        caption,
        text,
        ai_probability: aiProbability ?? 0,
        global_score: globalScore ?? 0,
        blocked: blocked ?? false,
        reason: reason ?? null,
        moderation_status: moderationStatus,
        moderation_decided_by: "ai-v1",
        moderation_decided_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error insertando post en Supabase:", error);
      return NextResponse.json(
        { error: "Error insertando post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
