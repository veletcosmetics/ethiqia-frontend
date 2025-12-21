import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!; // <-- añade esto en Render

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function requireAdminSecret(req: NextRequest) {
  const hdr = req.headers.get("x-admin-secret") || "";
  // Comparación simple; suficiente para MVP si el secret no se filtra.
  return Boolean(adminSecret) && hdr === adminSecret;
}

type StrikeBody = {
  userId: string; // UUID del usuario a sancionar
  reason?: string; // texto breve: "insultos", "acoso", etc.
  category?: string; // "harassment" | "hate" | "spam" | ...
  evidence?: string; // link/post_id/etc
  source?: string; // "manual" | "report" | "ai"
  points?: number; // por defecto -10
  // opcional: metadata extra
  metadata?: Record<string, any>;
};

// POST /api/moderation/strike
// Protegido con header: x-admin-secret: <ADMIN_SECRET>
// Body: { userId, reason, category, evidence, source, points? }
export async function POST(req: NextRequest) {
  try {
    if (!requireAdminSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<StrikeBody>;
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const strikePoints = Number.isFinite(body.points) ? Number(body.points) : -10;
    // Aseguramos que es penalización (negativa)
    const normalizedPoints = strikePoints > 0 ? -Math.abs(strikePoints) : strikePoints;

    const reason = (body.reason || "Mala conducta").toString().trim();
    const category = (body.category || "misconduct").toString().trim();
    const evidence = (body.evidence || "").toString().trim();
    const source = (body.source || "manual").toString().trim();

    // 1) Insertar evento de reputación (strike)
    // Nota: si tu tabla requiere actor_user_id NOT NULL, usamos el propio userId para cumplir.
    const { data: ev, error: evErr } = await supabaseAdmin
      .from("reputation_events")
      .insert({
        subject_type: "user",
        subject_id: userId,
        actor_user_id: userId, // MVP sin rol/mod: lo dejamos así para no romper constraints
        event_type: "misconduct_strike",
        points: normalizedPoints,
        metadata: {
          category,
          reason,
          evidence: evidence || null,
          source,
          rule: "manual_strike",
          ...((body.metadata && typeof body.metadata === "object") ? body.metadata : {}),
        },
      })
      .select("id, event_type, points, created_at, metadata")
      .single();

    if (evErr) {
      console.error("strike: error insert reputation_events", evErr);
      return NextResponse.json(
        { error: "Failed to insert misconduct_strike", details: evErr },
        { status: 400 }
      );
    }

    // 2) Insertar notificación (tu esquema actual: user_id, type, payload)
    const payload = {
      title: "Sanción aplicada",
      body: `Se ha aplicado una sanción de ${normalizedPoints} puntos por: ${reason}.`,
      points_delta: normalizedPoints,
      category,
      reason,
      evidence: evidence || null,
      source,
      reputation_event_id: ev.id,
    };

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "misconduct_strike",
      payload,
      // read_at null por defecto
    });

    if (nErr) {
      // No bloqueamos: el strike ya está registrado.
      console.error("strike: error insert notification", nErr);
    }

    return NextResponse.json(
      {
        ok: true,
        strike: ev,
        notification_inserted: !nErr,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("strike: unexpected", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// (Opcional) GET para sanity-check (no devuelve datos sensibles; solo confirma que está vivo)
// Requiere x-admin-secret igualmente.
export async function GET(req: NextRequest) {
  if (!requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, route: "/api/moderation/strike" }, { status: 200 });
}
