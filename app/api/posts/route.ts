// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

type PostInsertPayload = {
  userId: string;
  imageUrl?: string | null;
  caption?: string | null;
  aiProbability?: number | null;
  globalScore?: number | null;
  text?: string | null;
  blocked?: boolean | null;
  reason?: string | null;
};

// GET /api/posts → lista de posts para el feed
export async function GET(_req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,user_id,company_id,image_url,caption,created_at,moderation_status,moderation_reason,moderation_labels,moderation_decided_at,moderation_decided_by,ai_probability,global_score,text,blocked,reason"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error cargando posts:", error);
      return NextResponse.json(
        { error: "Error al cargar publicaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json(
      { error: "Error interno al cargar publicaciones" },
      { status: 500 }
    );
  }
}

// POST /api/posts → crea un post nuevo REAL
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostInsertPayload;

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

    if (!userId) {
      return NextResponse.json(
        { error: "userId es obligatorio" },
        { status: 400 }
      );
    }

    const safeAiProb =
      typeof aiProbability === "number" && !Number.isNaN(aiProbability)
        ? aiProbability
        : 0;

    const safeGlobalScore =
      typeof globalScore === "number" && !Number.isNaN(globalScore)
        ? globalScore
        : Math.max(0, Math.min(100, Math.round(100 - safeAiProb)));

    const isBlocked = !!blocked;
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: imageUrl ?? null,          // 👈 aquí se guarda la URL de Supabase Storage
        caption: caption ?? null,
        text: text ?? caption ?? null,
        ai_probability: safeAiProb,
        global_score: safeGlobalScore,
        blocked: isBlocked,
        reason: reason ?? null,
        moderation_status: isBlocked ? "rejected" : "approved",
        moderation_reason: reason ?? null,
        moderation_decided_at: nowIso,
        moderation_decided_by: "ai-v1",
        // moderation_labels las puedes rellenar más adelante si quieres
      })
      .select(
        "id,user_id,company_id,image_url,caption,created_at,moderation_status,moderation_reason,moderation_labels,moderation_decided_at,moderation_decided_by,ai_probability,global_score,text,blocked,reason"
      )
      .single();

    if (error) {
      console.error("Error insertando post en Supabase:", error);
      return NextResponse.json(
        { error: "Error al guardar la publicación" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error interno al crear la publicación" },
      { status: 500 }
    );
  }
}
