import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

function uuid(): string {
  return crypto.randomUUID();
}

function getMonthWindowUTC(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return {
    year: y,
    month: m + 1,
    startIso: start.toISOString(),
    nextIso: next.toISOString(),
  };
}

// GET /api/posts
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

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

    // Añadir liked_by_me para cada post
    const posts = data ?? [];
    let postsWithLiked = posts;
    if (posts.length > 0) {
      const postIds = posts.map((p: any) => p.id);
      const { data: likedRows } = await supabaseAdmin
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userData.user.id)
        .in("post_id", postIds);

      const likedSet = new Set((likedRows ?? []).map((r: any) => r.post_id));
      postsWithLiked = posts.map((p: any) => ({
        ...p,
        liked_by_me: likedSet.has(p.id),
      }));
    }

    return NextResponse.json({ posts: postsWithLiked });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

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

    // 2) Score: +1 el primer post aprobado del mes (anti-farm)
    let awarded = false;
    let pointsAwarded = 0;

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

          const { error: evErr } = await supabaseAdmin
            .from("reputation_events")
            .insert([{
              subject_type: "user",
              subject_id: userId,
              actor_user_id: userId,
              event_type: "active_month_awarded",
              points: pointsAwarded,
              metadata: {
                rule: "active_months",
                year,
                month,
                post_id: post.id,
                ai_disclosed: disclosed,
                ai_probability: aiProb,
                global_score: gScore,
              },
            }]);

          if (evErr) {
            console.error("Error insertando reputation_event:", evErr);
            awarded = false;
            pointsAwarded = 0;
          }
        }
      }
    }

    // 3) Notificación si hay puntos
    if (awarded && pointsAwarded > 0) {
      const { error: nErr } = await supabaseAdmin.from("notifications").insert({
        id: uuid(),
        user_id: userId,
        type: "points_awarded",
        payload: {
          title: "Mes activo",
          body: disclosed
            ? `Has ganado +${pointsAwarded} punto por estar activo este mes.`
            : `Has ganado +${pointsAwarded} punto por estar activo este mes.`,
          points_awarded: pointsAwarded,
          post_id: post.id,
          ai_disclosed: disclosed,
          ai_probability: aiProb,
          global_score: gScore,
        },
        read_at: null,
        created_at: nowIso,
      });

      if (nErr) console.error("Error insertando notification:", nErr);
    }

    return NextResponse.json({ post, awarded, points_awarded: pointsAwarded }, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE /api/posts  body: { postId }
export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId } = body ?? {};

    if (!postId) {
      return NextResponse.json({ error: "postId es obligatorio" }, { status: 400 });
    }

    // Verificar que el post pertenece al usuario
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    }

    if (existing.user_id !== userData.user.id) {
      return NextResponse.json({ error: "No puedes borrar posts de otros usuarios" }, { status: 403 });
    }

    // Borrar comentarios asociados primero
    await supabaseAdmin.from("comments").delete().eq("post_id", postId);

    // Borrar likes asociados
    await supabaseAdmin.from("post_likes").delete().eq("post_id", postId);

    // Borrar el post
    const { error: delErr } = await supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (delErr) {
      console.error("Error deleting post:", delErr);
      return NextResponse.json({ error: "Error borrando post" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en DELETE /api/posts:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
