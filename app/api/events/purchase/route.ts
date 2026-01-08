// app/api/events/purchase/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PurchaseEventBody = {
  // Quién compra (usuario Ethiqia)
  user_id: string;

  // En qué empresa (company_profiles.id)
  company_id: string;

  // Datos de compra
  amount_cents?: number;
  currency?: string; // "EUR"
  order_id?: string; // ID externo (Redsys/Prestashop/etc.)
  metadata?: Record<string, any>;

  // Firma (opcional): HMAC SHA256 del body RAW
  signature?: string;
};

/**
 * Firma HMAC:
 * - Prestashop / Velet genera: signature = HMAC_SHA256(rawBody, ETHIQIA_EVENTS_SECRET)
 * - Ethiqia verifica para impedir falsificaciones.
 */
function verifySignature(rawBody: string, signature?: string | null) {
  const secret = process.env.ETHIQIA_EVENTS_SECRET;

  // Si no defines el secreto, no bloqueamos (modo dev).
  if (!secret) return { ok: true, mode: "no-secret" as const };

  if (!signature) return { ok: false, reason: "missing-signature" as const };

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // timingSafeEqual requiere buffers de misma longitud
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(String(signature), "hex");
  if (a.length !== b.length) return { ok: false, reason: "bad-signature" as const };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true, mode: "hmac" as const } : { ok: false, reason: "bad-signature" as const };
}

function clampInt(n: any) {
  const x = typeof n === "number" ? n : parseInt(String(n || ""), 10);
  if (Number.isNaN(x)) return null;
  return x;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    let body: PurchaseEventBody;
    try {
      body = JSON.parse(rawBody) as PurchaseEventBody;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
    }

    const sigHeader =
      req.headers.get("x-ethiqia-signature") ||
      req.headers.get("x-signature") ||
      body.signature ||
      null;

    const sigCheck = verifySignature(rawBody, sigHeader);
    if (!sigCheck.ok) {
      return NextResponse.json(
        { ok: false, error: "signature-invalid", reason: sigCheck.reason },
        { status: 401 }
      );
    }

    const user_id = (body.user_id || "").trim();
    const company_id = (body.company_id || "").trim();

    if (!user_id || !company_id) {
      return NextResponse.json(
        { ok: false, error: "missing-fields", required: ["user_id", "company_id"] },
        { status: 400 }
      );
    }

    const amount_cents = clampInt(body.amount_cents);
    const currency = (body.currency || "EUR").trim() || "EUR";
    const order_id = body.order_id ? String(body.order_id).trim() : null;
    const metadata = body.metadata ?? null;

    // =========================
    // (A) DEDUPLICACIÓN (MVP)
    // =========================
    // Si llega el mismo order_id 2 veces (muy normal en webhooks),
    // devolvemos OK sin crear duplicados.
    if (order_id) {
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("purchase_events")
        .select("id, created_at")
        .eq("company_id", company_id)
        .eq("order_id", order_id)
        .maybeSingle();

      if (exErr) {
        // No rompemos por un warning, pero lo dejamos en logs.
        console.warn("[purchase] check existing warning:", exErr.message);
      } else if (existing?.id) {
        return NextResponse.json({
          ok: true,
          deduped: true,
          event_id: existing.id,
          created_at: existing.created_at,
          signature_mode: sigCheck.mode,
        });
      }
    }

    // =========================
    // (B) INSERT purchase_events
    // =========================
    const { data: ev, error: evErr } = await supabaseAdmin
      .from("purchase_events")
      .insert({
        user_id,
        company_id,
        amount_cents,
        currency,
        order_id,
        metadata,
      })
      .select("id, created_at")
      .single();

    if (evErr) {
      console.error("[purchase] insert purchase_events error:", evErr);
      return NextResponse.json(
        { ok: false, error: "db-insert-failed", details: evErr.message },
        { status: 500 }
      );
    }

    // =========================
    // (C) NOTIFICACIÓN (TU ESQUEMA REAL)
    // notifications: id, user_id, type, payload, read_at, created_at
    // =========================
    const euros = typeof amount_cents === "number" ? (amount_cents / 100).toFixed(2) : null;

    const notifPayload = {
      title: "Compra registrada",
      body: euros
        ? `Se ha registrado una compra de ${euros} ${currency}.`
        : "Se ha registrado una compra.",
      event_type: "purchase",
      company_id,
      order_id,
      amount_cents,
      currency,
      // Deja esto como base para el “puntos por comprar vegano/ecológico”
      points_awarded: 0,
    };

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id,
      type: "purchase",
      payload: notifPayload,
      // created_at lo pone default si lo tienes; si no, lo crea el insert igualmente si hay default.
    });

    const notified_user = !nErr;
    if (nErr) console.warn("[purchase] insert notification warning:", nErr.message);

    // =========================
    // (D) SUBIR SCORE DE LA EMPRESA (MVP)
    // =========================
    // Ajusta este número a lo que quieras para demo (2, 4, etc.)
    const COMPANY_POINTS_DELTA = 4;

    // Leemos score actual y sumamos (evita depender de triggers ahora)
    const { data: cp, error: cpErr } = await supabaseAdmin
      .from("company_profiles")
      .select("ethq_score")
      .eq("id", company_id)
      .maybeSingle();

    let company_points_applied = false;
    if (!cpErr) {
      const current = typeof cp?.ethq_score === "number" ? cp.ethq_score : 0;
      const next = Math.max(0, Math.min(100, Math.round(current + COMPANY_POINTS_DELTA)));

      const { error: upErr } = await supabaseAdmin
        .from("company_profiles")
        .update({
          ethq_score: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company_id);

      if (!upErr) company_points_applied = true;
      else console.warn("[purchase] update company score warning:", upErr.message);
    } else {
      console.warn("[purchase] read company score warning:", cpErr.message);
    }

    return NextResponse.json({
      ok: true,
      event_id: ev.id,
      created_at: ev.created_at,
      signature_mode: sigCheck.mode,
      notified_user,
      company_points_applied,
      company_points_delta: COMPANY_POINTS_DELTA,
    });
  } catch (e: any) {
    console.error("[purchase] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
