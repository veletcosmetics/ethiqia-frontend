import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

// GET /api/posts -> auth + filtros opcionales:
//   /api/posts?mine=1
//   /api/posts?user_id=UUID
export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "1";
    const userIdParam = url.searchParams.get("user_id");

    let q = supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false });

    if (mine) q = q.eq("user_id", userData.user.id);
    else if (userIdParam) q = q.eq("user_id", userIdParam);

    const { data, error } = await q;

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
    return NextResponse.json({ error: "Error inesperado cargando posts" }, { status: 500 });
  }
}

// POST /api/posts -> crea post + reputation_events + notificación puntos (payload)
export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = await req.json();

    const { imageUrl, caption, aiProbability, globalScore, text, blocked, reason, aiDisclosed } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Falta imageUrl en el body" }, { status: 400 });
    }

    const aiProb = typeof aiProbability === "number" ? aiProbability : 0;
    const gScore = typeof globalScore === "number" ? globalScore : 0;
    const isBlocked = Boolean(blocked);
    const disclosed = Boolean(aiDisclosed);

    const moderationStatus = isBlocked ? "rejected" : "approved";

    // 1) Insertar post
    const { data: post, error: postErr } = await supabaseAdmin
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

    if (postErr) {
      console.error("Error insertando post:", postErr);
      return NextResponse.json({ error: "Error insertando post", details: postErr }, { status: 400 });
    }

    // 2) reputation_events
    const pointsBase = 3;
    const pointsDisclosure = disclosed ? 1 : 0;
    const pointsAwarded = pointsBase + pointsDisclosure;

    const events: any[] = [
      {
        subject_type: "user",
        subject_id: userId,
        actor_user_id: userId,
        event_type: "post_created",
        points: pointsBase,
        metadata: {
          post_id: post.id,
          ai_probability: aiProb,
          global_score: gScore,
          blocked: isBlocked,
        },
      },
    ];

    if (disclosed) {
      events.push({
        subject_type: "user",
        subject_id: userId,
        actor_user_id: userId,
        event_type: "ai_disclosed",
        points: pointsDisclosure,
        metadata: { post_id: post.id },
      });
    }

    const { error: evErr } = await supabaseAdmin.from("reputation_events").insert(events);
    if (evErr) {
      console.error("Error insertando reputation_events:", evErr);
      // No bloqueamos el post
    }

    // 3) Notificación puntos (TU ESQUEMA REAL: user_id, type, payload)
    const payload = {
      title: "Publicación creada",
      body: disclosed
        ? `Has ganado +${pointsAwarded} puntos (+3 por publicar, +1 por transparencia IA).`
        : `Has ganado +${pointsAwarded} puntos por publicar.`,
      points_awarded: pointsAwarded,
      post_id: post.id,
      ai_disclosed: disclosed,
      ai_probability: aiProb,
      global_score: gScore,
    };

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "points_awarded",
      payload,
      // read_at: null -> por defecto se queda null
      // created_at: default now() (si lo tienes así en tabla)
    });

    if (nErr) {
      console.error("Error insertando notification:", nErr);
      // No bloqueamos el post
    }

    return NextResponse.json({ post, points_awarded: pointsAwarded }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json({ error: "Error inesperado guardando el post" }, { status: 500 });
  }
}
