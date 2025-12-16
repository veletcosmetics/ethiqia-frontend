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

function isNonEmpty(s: any) {
  return typeof s === "string" && s.trim().length > 0;
}

function bioOk(bio: any) {
  return typeof bio === "string" && bio.trim().length >= 40; // MVP: mínimo 40 chars
}

function locationOk(loc: any) {
  // En v0.1 usamos "location" como "país/ubicación normalizada"
  return typeof loc === "string" && loc.trim().length >= 2;
}

async function requireUser(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return { user: null, error: "Missing Authorization Bearer token" };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: "Invalid session" };

  return { user: data.user, error: null };
}

// POST /api/profile/complete-min
// Otorga +2 UNA sola vez si el perfil cumple:
// email verificado + full_name + avatar_url + location + bio(min 40)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    // Email verificado (supabase devuelve campos distintos según versión)
    const emailVerified =
      Boolean((user as any).email_confirmed_at) ||
      Boolean((user as any).confirmed_at) ||
      Boolean((user as any).email_verified);

    if (!emailVerified) {
      return NextResponse.json(
        { awarded: false, reason: "email_not_verified" },
        { status: 200 }
      );
    }

    // Cargar perfil
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, bio, location, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) {
      console.error("Error loading profile:", pErr);
      return NextResponse.json({ error: "Error loading profile" }, { status: 500 });
    }

    const ok =
      profile &&
      isNonEmpty((profile as any).full_name) &&
      isNonEmpty((profile as any).avatar_url) &&
      locationOk((profile as any).location) &&
      bioOk((profile as any).bio);

    if (!ok) {
      return NextResponse.json(
        {
          awarded: false,
          reason: "profile_incomplete",
          missing: {
            full_name: !isNonEmpty(profile?.full_name),
            avatar_url: !isNonEmpty((profile as any)?.avatar_url),
            location: !locationOk((profile as any)?.location),
            bio: !bioOk((profile as any)?.bio),
          },
        },
        { status: 200 }
      );
    }

    // ¿Ya otorgado?
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("reputation_events")
      .select("id")
      .eq("subject_type", "user")
      .eq("subject_id", user.id)
      .eq("event_type", "profile_completed_min")
      .limit(1);

    if (exErr) {
      console.error("Error checking existing event:", exErr);
      return NextResponse.json({ error: "Error checking existing event" }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ awarded: false, reason: "already_awarded" }, { status: 200 });
    }

    const points = 2;

    // 1) Insert event (ledger)
    const { error: evErr } = await supabaseAdmin.from("reputation_events").insert({
      subject_type: "user",
      subject_id: user.id,
      actor_user_id: user.id,
      event_type: "profile_completed_min",
      points,
      metadata: {
        full_name: true,
        avatar_url: true,
        location: true,
        bio_min_chars: 40,
      },
    });

    if (evErr) {
      console.error("Error inserting reputation event:", evErr);
      return NextResponse.json({ error: "Error awarding points" }, { status: 500 });
    }

    // 2) Insert notification (robusto ante esquema variable)
    const notifPayload = {
      title: "Perfil completado",
      body: `Has ganado +${points} puntos por completar tu perfil (transparencia).`,
      points_awarded: points,
      event_type: "profile_completed_min",
    };

    // Intento A: esquema con payload
    const { error: nErrA } = await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "points_awarded",
      payload: notifPayload,
    });

    // Si falla porque no existe "payload", intentamos esquema con columnas planas
    if (nErrA) {
      const msg = String((nErrA as any).message || "");
      if (msg.includes('column "payload"') || msg.includes("payload")) {
        const { error: nErrB } = await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "points_awarded",
          title: notifPayload.title,
          body: notifPayload.body,
          points_awarded: String(points),
          read_at: null,
        });

        if (nErrB) console.error("Error inserting notification (flat):", nErrB);
      } else {
        console.error("Error inserting notification:", nErrA);
      }
    }

    return NextResponse.json(
      { awarded: true, points_awarded: points, event_type: "profile_completed_min" },
      { status: 200 }
    );
  } catch (e) {
    console.error("Unexpected error complete-min:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
