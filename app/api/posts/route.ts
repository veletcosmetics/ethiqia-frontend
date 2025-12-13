import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público (para POST si lo necesitas con anon)
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (para GET + merge nombres sin RLS)
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || supabaseAnonKey
);

export async function GET() {
  try {
    // 1) Posts
    const { data: posts, error: e1 } = await supabaseAdmin
      .from("posts")
      .select(
        "id,user_id,image_url,caption,created_at,ai_probability,global_score,text,blocked,reason"
      )
      .order("created_at", { ascending: false });

    if (e1) {
      console.error("Error cargando posts:", e1);
      return NextResponse.json(
        { error: "Error cargando posts", details: e1 },
        { status: 500 }
      );
    }

    const safePosts = posts ?? [];

    // 2) IDs únicos
    const userIds = Array.from(
      new Set(
        safePosts
          .map((p: any) => p?.user_id)
          .filter(Boolean) as string[]
      )
    );

    // 3) Profiles
    let nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles, error: e2 } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (e2) {
        console.error("Error cargando profiles:", e2);
      } else {
        (profiles ?? []).forEach((p: any) => {
          nameById.set(p.id, (p.full_name ?? "Usuario Ethiqia") as string);
        });
      }
    }

    // 4) Merge (author_full_name)
    const enriched = safePosts.map((p: any) => ({
      ...p,
      author_full_name: nameById.get(p.user_id) ?? "Usuario Ethiqia",
    }));

    return NextResponse.json({ posts: enriched }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado cargando posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts (lo dejo como lo tenías: funciona y no lo rompemos)
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
      return NextResponse.json({ error: "Falta userId en el body" }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Falta imageUrl en el body" }, { status: 400 });
    }

    const aiProb = typeof aiProbability === "number" ? aiProbability : 0;
    const gScore = typeof globalScore === "number" ? globalScore : 0;
    const isBlocked = Boolean(blocked);
    const moderationStatus = isBlocked ? "rejected" : "approved";

    const { data, error } = await supabasePublic
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

    // Nota: el POST devuelve el post sin author_full_name; el feed lo mostrará tras recargar
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado guardando el post" },
      { status: 500 }
    );
  }
}
