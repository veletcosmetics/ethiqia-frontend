// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL o SUPABASE_ANON_KEY no están definidos");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tipo básico para usar en el feed
export type Post = {
  id: string;
  user_id: string | null;
  company_id: string | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  moderation_status: string | null;
  moderation_raw: string | null;
  moderation_labels: any | null;
  moderation_decided_at: string | null;
  moderation_decision: string | null;
  ai_probability: number | null;
  global_score: number | null;
  text: string | null;
  blocked: boolean | null;
  reason: string | null;
};

// GET → devolver posts reales desde Supabase
export async function GET() {
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

  return NextResponse.json({ posts: (data ?? []) as Post[] });
}

// POST → crear un post real en la tabla
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      // OJO: NO vamos a usar userId todavía
      imageUrl,
      caption,
      aiProbability,
      globalScore,
      text,
      blocked,
      reason,
      moderationStatus,
      moderationRaw,
      // NO usamos moderationLabels ni moderationDecision por ahora
    } = body;

    const insertPayload = {
      // SIN user_id → no tocamos la FK
      image_url: imageUrl ?? null,
      caption: caption ?? null,
      ai_probability: aiProbability ?? null,
      global_score: globalScore ?? 0,
      text: text ?? null,
      blocked: blocked ?? false,
      reason: reason ?? null,
      moderation_status: moderationStatus ?? "pending",
      moderation_raw: moderationRaw ?? null,
      // NO enviamos moderation_labels ni moderation_decision
    };

    const { data, error } = await supabase
      .from("posts")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Error insertando post en Supabase:", error);
      return NextResponse.json(
        { error: "Error creando post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data as Post });
  } catch (err) {
    console.error("Error en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
