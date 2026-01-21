import { NextRequest, NextResponse } from "next/server";
import { supabaseServerService } from "@/lib/supabaseServer";
import { sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";

/**
 * Limita valores numéricos para evitar basura
 */
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Endpoint webhook para recibir pasos desde iPhone (Atajos / Apple Health)
 *
 * POST /api/events/steps?token=XXXX
 *
 * Body JSON:
 * {
 *   "user_id": "uuid",
 *   "date": "YYYY-MM-DD",
 *   "steps_count": 8420,
 *   "source": "apple_health"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    /* -------------------------------------------------------
       1. Validar token de acceso (query param)
    ------------------------------------------------------- */
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "missing_token" }, { status: 401 });
    }

    /* -------------------------------------------------------
       2. Leer y parsear body
    ------------------------------------------------------- */
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const userId = body?.user_id;
    const date = body?.date;
    const stepsRaw = body?.steps_count;
    const source = body?.source || "apple_health";

    /* -------------------------------------------------------
       3. Validaciones básicas de payload
    ------------------------------------------------------- */
    if (typeof userId !== "string" || userId.length < 10) {
      return NextResponse.json({ error: "invalid_user_id" }, { status: 400 });
    }

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "invalid_date", hint: "Formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (typeof stepsRaw !== "number" || !Number.isFinite(stepsRaw)) {
      return NextResponse.json(
        { error: "invalid_steps_count" },
        { status: 400 }
      );
    }

    const stepsCount = clampInt(Math.floor(stepsRaw), 0, 120000);

    /* -------------------------------------------------------
       4. Inicializar Supabase con Service Role
    ------------------------------------------------------- */
    const sb = supabaseServerService();

    /* -------------------------------------------------------
       5. Validar token contra DB (hash + prefix)
    ------------------------------------------------------- */
    const tokenPrefix = token.slice(0, 10);
    const tokenHash = sha256Hex(token);

    const { data: tokens, error: tokenErr } = await sb
      .from("user_webhook_tokens")
      .select("id, user_id, token_hash, is_revoked, label")
      .eq("token_prefix", tokenPrefix)
      .limit(10);

    if (tokenErr) {
      return NextResponse.json(
        { error: "db_token_lookup_failed", detail: tokenErr.message },
        { status: 500 }
      );
    }

    const match = (tokens || []).find(
      (t) => t.token_hash === tokenHash && !t.is_revoked
    );

    if (!match) {
      return NextResponse.json(
        { error: "invalid_or_revoked_token" },
        { status: 401 }
      );
    }

    if (match.user_id !== userId) {
      return NextResponse.json(
        { error: "token_user_mismatch" },
        { status: 403 }
      );
    }

    /* -------------------------------------------------------
       6. Dedupe: 1 evento por usuario y día
    ------------------------------------------------------- */
    const dedupeKey = `steps:${userId}:${date}`;
    const occurredAt = new Date(`${date}T23:59:00.000Z`).toISOString();

    /* -------------------------------------------------------
       7. Insertar evento
    ------------------------------------------------------- */
    const { error: insertErr, data: event } = await sb
      .from("events")
      .insert({
        event_type: "steps_verified",
        subject_type: "user",
        subject_id: userId,
        source,
        confidence: "high",
        occurred_at: occurredAt,
        dedupe_key: dedupeKey,
        metadata: {
          steps_count: stepsCount,
          date,
          token_id: match.id,
          label: match.label,
        },
      })
      .select(
        "id, event_type, subject_type, subject_id, source, occurred_at, metadata"
      )
      .single();

    if (insertErr) {
      // Si ya existe (mismo día), no es error
      if (insertErr.message?.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: true, deduped: true });
      }

      return NextResponse.json(
        { error: "event_insert_failed", detail: insertErr.message },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       8. OK
    ------------------------------------------------------- */
    return NextResponse.json({ ok: true, event });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message },
      { status: 500 }
    );
  }
}
