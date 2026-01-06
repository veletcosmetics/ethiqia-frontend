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
  order_id?: string; // ID externo (Redsys/Shopify/etc.)
  metadata?: Record<string, any>;

  // Firma (opcional): HMAC SHA256 del body RAW
  signature?: string;
};

/**
 * Firma HMAC recomendada:
 * - En Velet generas: signature = HMAC_SHA256(rawBody, ETHIQIA_EVENTS_SECRET)
 * - En Ethiqia la verificamos para que nadie falsifique compras.
 */
function verifySignature(rawBody: string, signature?: string | null) {
  const secret = process.env.ETHIQIA_EVENTS_SECRET;
  if (!secret) {
    // Si no defines el secreto, no bloqueamos (modo dev).
    return { ok: true, mode: "no-secret" as const };
  }

  if (!signature) return { ok: false, reason: "missing-signature" as const };

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // timingSafeEqual requiere buffers de misma longitud
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return { ok: false, reason: "bad-signature" as const };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true, mode: "hmac" as const } : { ok: false, reason: "bad-signature" as const };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: PurchaseEventBody | null = null;

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

    const amount_cents = typeof body.amount_cents === "number" ? body.amount_cents : null;
    const currency = (body.currency || "EUR").trim();
    const order_id = body.order_id ? String(body.order_id) : null;
    const metadata = body.metadata ?? null;

    // 1) Guardar evento (tabla recomendada)
    // Crea luego esta tabla: purchase_events (id uuid, created_at, user_id, company_id, amount_cents, currency, order_id, metadata jsonb)
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

    // 2) Crear notificación (si tienes tabla notifications ya en tu sistema)
    // Ajusta los campos si tu esquema es distinto.
    const title = "Compra registrada";
    const euros =
      typeof amount_cents === "number" ? (amount_cents / 100).toFixed(2) : null;

    const bodyText = euros
      ? `Se ha registrado una compra de ${euros} ${currency}.`
      : "Se ha registrado una compra.";

    // Ejemplo: dar puntos (placeholder). Más adelante lo conectamos a reglas (vegano/ecológico, etc.)
    const points_awarded = 2;

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id,
      type: "purchase",
      title,
      body: bodyText,
      points_awarded,
      post_id: null,
      payload: {
        company_id,
        order_id,
        amount_cents,
        currency,
        points_awarded,
      },
    });

    if (nErr) {
      // No rompemos el endpoint si falla la notificación
      console.warn("[purchase] insert notification warning:", nErr.message);
    }

    return NextResponse.json({
      ok: true,
      event_id: ev.id,
      created_at: ev.created_at,
      signature_mode: sigCheck.mode,
      points_awarded,
    });
  } catch (e: any) {
    console.error("[purchase] unexpected error:", e);
    return NextResponse.json({ ok: false, error: "unexpected", details: String(e?.message || e) }, { status: 500 });
  }
}
