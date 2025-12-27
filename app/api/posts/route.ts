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

function uuid(): string {
  // Node runtime: crypto.randomUUID() está disponible en Node 18+
  return crypto.randomUUID();
}

function getMonthWindowUTC(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return {
    year: y,
    month: m + 1, // 1-12 para metadata
    startIso: start.toISOString(),
    nextIso: next.toISOString(),
  };
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

    let q = supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

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
    return NextResponse.json(
      { error: "Error inesperado cargando posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts -> crea post + (hito mensual) reputation_events + notificación
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

    const {
      imageUrl,
      caption,
      aiProbability,
      globalScore,
      text,
      blocked,
      reason,
      aiDisclosed,
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Falta imageUrl en el body" }, { status: 400 });
    }

    const aiProb = typeof aiProbability === "number" ? aiProbability : 0;
    const gScore = typeof globalScore === "number" ? globalScore : 0;
    const isBlocked = Boolean(blocked);
    const disclosed = Boolean(aiDisclosed);

    const moderationStatus = isBlocked ? "rejected" : "approved";
    const nowIso = new Date().toISOString();

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
        moderation_decided_at: nowIso,
        moderation_decided_by: "ai-v1",
        moderation_labels: null,
      })
      .select("*")
      .single();

    if (postErr) {
      console.error("Error insertando post:", postErr);
      return NextResponse.json(
        { error: "Error insertando post", details: postErr },
        { status: 400 }
      );
    }

    // 2) Score por HITO (anti-farm):
    // +1 SOLO el primer post APROBADO de cada mes (mes activo)
    // “He usado IA” se registra, pero NO suma puntos por ahora (evita farm).
    let awarded = false;
    let pointsAwarded = 0;

    // Solo consideramos mes activo si el post ha sido aprobado
    if (!isBlocked) {
      const { year, month, startIso, nextIso } = getMonthWindowUTC(new Date());

      const { data: already, error: existsErr } = await supabaseAdmin
        .from("reputation_events")
        .select("id")
        .eq("subject_type", "user")
        .eq("subject_id", userId)
        .eq("event_type", "active_month_awarded")
        .gte("created_at", startIso)
        .lt("created_at", nextIso)
        .limit(1);

      if (existsErr) {
        console.error("Error comprobando hito mensual:", existsErr);
      } else {
        const hasAwardedThisMonth = Array.isArray(already) && already.length > 0;

        if (!hasAwardedThisMonth) {
          awarded = true;
          pointsAwarded = 1;

          const eventRow = {
            subject_type: "user",
            subject_id: userId,
            actor_user_id: userId,
            event_type: "active_month_awarded",
            points: pointsAwarded,
            metadata: {
              rule: "active_months",
              year,
              month, // 1-12
              post_id: post.id,
              ai_disclosed: disclosed,
              ai_probability: aiProb,
              global_score: gScore,
            },
          };

          const { error: evErr } = await supabaseAdmin
            .from("reputation_events")
            .insert([eventRow]);

          if (evErr) {
            console.error("Error insertando reputation_event (active_month_awarded):", evErr);
            // no bloqueamos el post; simplemente no damos puntos
            awarded = false;
            pointsAwarded = 0;
          }
        }
      }
    }

    // 3) Notificación SOLO si hay puntos
    if (awarded && pointsAwarded > 0) {
      const payload = {
        title: "Mes activo",
        body: disclosed
          ? `Has ganado +${pointsAwarded} punto por estar activo este mes. (Marcado “He usado IA” registrado, sin puntos).`
          : `Has ganado +${pointsAwarded} punto por estar activo este mes.`,
        points_awarded: pointsAwarded,
        post_id: post.id,
        ai_disclosed: disclosed,
        ai_probability: aiProb,
        global_score: gScore,
      };

      const { error: nErr } = await supabaseAdmin.from("notifications").insert({
        id: uuid(),
        user_id: userId,
        type: "points_awarded",
        payload,
        read_at: null,
        created_at: nowIso,
      });

      if (nErr) {
        console.error("Error insertando notification:", nErr);
        // no bloqueamos el post
      }
    }

    return NextResponse.json(
      {
        post,
        awarded,
        points_awarded: pointsAwarded,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado guardando el post" },
      { status: 500 }
    );
  }
}
