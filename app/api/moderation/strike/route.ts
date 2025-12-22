import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSecret = process.env.ADMIN_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function isAuthorized(req: NextRequest) {
  const provided = req.headers.get("x-admin-secret") || "";
  return Boolean(adminSecret) && provided === adminSecret;
}

type StrikeBody = {
  userId: string;
  reason?: string;
  category?: string;
  source?: string;
  evidence?: string;
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, route: "/api/moderation/strike" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<StrikeBody>;
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const reason = String(body.reason || "Misconduct strike").trim();
    const category = String(body.category || "manual").trim();
    const source = String(body.source || "admin_secret").trim();
    const evidence = body.evidence ? String(body.evidence) : null;

    // 1) Insertar evento en reputation_events (penalización inmediata -10)
    const { data: strikeEvent, error: evErr } = await supabaseAdmin
      .from("reputation_events")
      .insert({
        subject_type: "user",
        subject_id: userId,
        actor_user_id: null,
        event_type: "misconduct_strike",
        points: -10,
        metadata: {
          reason,
          category,
          source,
          evidence,
        },
      })
      .select("id, subject_id, event_type, points, created_at, metadata")
      .single();

    if (evErr) {
      console.error("strike: insert reputation_events error", evErr);
      return NextResponse.json(
        { error: "Failed to insert strike", details: evErr },
        { status: 500 }
      );
    }

    // 2) Insertar notificación (tu esquema actual: user_id, type, payload)
    const payload = {
      title: "Strike por mala conducta",
      body: `Se ha aplicado una penalización de -10 puntos. Motivo: ${reason}`,
      points_delta: -10,
      event_id: strikeEvent.id,
      category,
      source,
    };

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "misconduct_strike",
      payload,
    });

    if (nErr) {
      console.error("strike: insert notifications error", nErr);
      // No bloqueamos el strike por fallo de notificación
    }

    return NextResponse.json({ ok: true, strike: strikeEvent }, { status: 201 });
  } catch (err) {
    console.error("strike: unexpected", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
