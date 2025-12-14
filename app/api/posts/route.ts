import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente “público” (como lo tenías)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin SOLO en servidor (para enriquecer autores)
const supabaseAdmin =
  serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// GET /api/posts  → devuelve todos los posts (con datos de autor)
export async function GET() {
  try {
    const { data: posts, error } = await supabase
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

    const list = posts ?? [];

    // Si no hay service role, devolvemos lo que hay (sin autor enriquecido)
    if (!supabaseAdmin || list.length === 0) {
      return NextResponse.json({ posts: list }, { status: 200 });
    }

    // Enriquecer autores en batch
    const userIds = Array.from(
      new Set(list.map((p: any) => p.user_id).filter(Boolean))
    ) as string[];

    if (userIds.length === 0) {
      return NextResponse.json({ posts: list }, { status: 200 });
    }

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", userIds);

    if (profErr) {
      console.error("Error cargando profiles para posts:", profErr);
      return NextResponse.json({ posts: list }, { status: 200 });
    }

    const map = new Map<string, any>();
    (profiles ?? []).forEach((p) => map.set(p.id, p));

    const enriched = list.map((p: any) => {
      const pr = map.get(p.user_id);
      return {
        ...p,
        author_name: pr?.full_name ?? null,
        author_username: pr?.username ?? null,
        author_avatar_url: pr?.avatar_url ?? null,
      };
    });

    return NextResponse.json({ posts: enriched }, { status: 200 });
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
        moderation_status: moderationStatus,
        moderation_decided_at: new Date().toISOString(),
        moderation_decided_by: "ai-v1",
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
