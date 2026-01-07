// app/api/events/purchase/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PurchaseEventBody = {
  // Quién compra (usuario Ethiqia) - OPCIONAL (MVP)
  user_id?: string | null;

  // En qué empresa (company_profiles.id) - OBLIGATORIO
  company_id: string;

  // Datos de compra
  amount_cents?: number;
  currency?: string; // "EUR"
  order_id?: string; // ID externo (Redsys/PayPal/Klarna/Prestashop/etc.)
  metadata?: Record<string, any>;

  // Firma (opcional): HMAC SHA256 del body RAW
  signature?: string;
};

/**
 * Firma HMAC recomendada:
 * - En Velet/Prestashop generas: signature = HMAC_SHA256(rawBody, ETHIQIA_EVENTS_SECRET)
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

function clampScore(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
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

    // company_id obligatorio
    const company_id = String(body.company_id || "").trim();
    if (!company_id) {
      return NextResponse.json(
        { ok: false, error: "missing-fields", required: ["company_id"] },
        { status: 400 }
      );
    }

    // user_id opcional (si no viene, no hay notificación a usuario)
    const user_id_raw = body.user_id ? String(body.user_id).trim() : "";
    const user_id = user_id_raw ? user_id_raw : null;

    const amount_cents = typeof body.amount_cents === "number" ? body.amount_cents : null;
    const currency = (body.currency || "EUR").trim() || "EUR";
    const order_id = body.order_id ? String(body.order_id) : null;
    const metadata = body.metadata ?? null;

    // 1) Guardar evento (SIEMPRE)
    // Requiere tabla purchase_events:
    // id uuid, created_at, user_id uuid NULL, company_id uuid NOT NULL, amount_cents int NULL, currency text, order_id text NULL, metadata jsonb NULL
    const { data: ev, error: evErr } = await supabaseAdmin
      .from("purchase_events")
      .insert({
        user_id, // puede ser null
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

    // 2) MVP: subir score de empresa +1 por compra (capado a 100)
    // (Si tu tabla company_profiles no tiene ethq_score o no quieres tocarlo, quita este bloque.)
    try {
      const { data: cp, error: cpErr } = await supabaseAdmin
        .from("company_profiles")
        .select("ethq_score")
        .eq("id", company_id)
        .maybeSingle();

      if (!cpErr) {
        const current = typeof cp?.ethq_score === "number" ? cp.ethq_score : 50;
        const next = clampScore(Math.min(100, current + 1));

        const { error: upErr } = await supabaseAdmin
          .from("company_profiles")
          .update({ ethq_score: next })
          .eq("id", company_id);

        if (upErr) console.warn("[purchase] update company score warning:", upErr.message);
      }
    } catch (e: any) {
      console.warn("[purchase] score block warning:", String(e?.message || e));
    }

    // 3) Notificación SOLO si hay user_id (David solo si compra David)
    let points_awarded: number | null = null;

    if (user_id) {
      const title = "Compra registrada";
      const euros = typeof amount_cents === "number" ? (amount_cents / 100).toFixed(2) : null;

      const bodyText = euros
        ? `Se ha registrado una compra de ${euros} ${currency}.`
        : "Se ha registrado una compra.";

      // MVP: puntos fijos (luego lo hacemos por reglas: vegano/ecológico, etc.)
      points_awarded = 2;

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
        points_awarded = null;
      }
    }

    return NextResponse.json({
      ok: true,
      event_id: ev.id,
      created_at: ev.created_at,
      signature_mode: sigCheck.mode,
      notified_user: !!user_id,
      points_awarded,
    });
  } catch (e: any) {
    console.error("[purchase] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
