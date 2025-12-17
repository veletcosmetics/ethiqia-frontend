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

async function requireUser(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return { user: null as any, error: "Missing Authorization Bearer token" };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { user: null as any, error: "Invalid session" };

  return { user: data.user, error: null as string | null };
}

const MIN_BIO_LEN = 40;

function computeMissing(profile: any) {
  const missing: string[] = [];

  if (!profile?.full_name?.trim()) missing.push("full_name");
  if (!profile?.username?.trim()) missing.push("username");
  if (!profile?.avatar_url?.trim()) missing.push("avatar_url");
  if (!profile?.location?.trim()) missing.push("location");

  const bio = String(profile?.bio ?? "").trim();
  if (bio.length < MIN_BIO_LEN) missing.push("bio");

  return missing;
}

// POST /api/profile/complete-min
// - Comprueba “perfil mínimo completo”
// - Si cumple y no se ha premiado antes: inserta reputation_events(profile_completed_min +2) + notifications(points_awarded)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    // 1) Leer perfil
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, bio, location, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) {
      console.error("complete-min: error leyendo profile:", pErr);
      return NextResponse.json({ error: "Error leyendo perfil", details: pErr }, { status: 500 });
    }

    const missing = computeMissing(profile);
    if (missing.length > 0) {
      return NextResponse.json(
        { ok: true, awarded: false, missing, rule: { MIN_BIO_LEN } },
        { status: 200 }
      );
    }

    // 2) Idempotencia: si ya existe el evento, no duplicar
    const { data: existing, error: eErr } = await supabaseAdmin
      .from("reputation_events")
      .select("id")
      .eq("subject_type", "user")
      .eq("subject_id", user.id)
      .eq("event_type", "profile_completed_min")
      .limit(1);

    if (eErr) {
      console.error("complete-min: error buscando evento existente:", eErr);
      return NextResponse.json({ error: "Error validando evento existente", details: eErr }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, awarded: false, reason: "already_awarded" }, { status: 200 });
    }

    // 3) Insertar evento + notificación
    const points = 2;

    const { error: insErr } = await supabaseAdmin.from("reputation_events").insert({
      subject_type: "user",
      subject_id: user.id,
      actor_user_id: user.id,
      event_type: "profile_completed_min",
      points,
      metadata: {
        rule: "min_profile_v1",
        min_bio_len: MIN_BIO_LEN,
      },
    });

    if (insErr) {
      console.error("complete-min: error insertando reputation_event:", insErr);
      return NextResponse.json({ error: "Error insertando evento", details: insErr }, { status: 500 });
    }

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "points_awarded",
      payload: {
        title: "Perfil completo",
        body: `Has ganado +${points} puntos por completar tu perfil.`,
        points_awarded: points,
        event_type: "profile_completed_min",
      },
    });

    if (nErr) {
      // No bloqueamos: el evento ya está insertado
      console.error("complete-min: error insertando notification:", nErr);
    }

    return NextResponse.json({ ok: true, awarded: true, points_awarded: points }, { status: 200 });
  } catch (err) {
    console.error("complete-min: error inesperado:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

