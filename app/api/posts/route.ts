// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL o SUPABASE_ANON_KEY no están definidos");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tipo básico para los posts que usamos en el feed
export type Post = {
  id: string;
  user_id: string | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  ai_probability: number | null;
  global_score: number | null;
  text: string | null;
  blocked: boolean | null;
  reason: string | null;
};

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

export async function POST(req: Request) {
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

    // Insert mínimo: solo columnas que sabemos que EXISTEN
    const insertPayload = {
      user_id: userId ?? null,
      image_url: imageUrl ?? null,
      caption: caption ?? null,
      text: text ?? caption ?? null,
      ai_probability: aiProbability ?? null,
      global_score: globalScore ?? 0,
      blocked: blocked ?? false,
      reason: reason ?? null,
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
