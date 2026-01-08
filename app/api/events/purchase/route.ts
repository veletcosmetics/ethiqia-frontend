// app/api/events/purchase/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PurchaseEventBody = {
  user_id: string;
  company_id: string;
  amount_cents?: number;
  currency?: string;
  order_id?: string;
  metadata?: Record<string, any>;
  signature?: string;
};

function verifySignature(rawBody: string, signature?: string | null) {
  const secret = process.env.ETHIQIA_EVENTS_SECRET;
  if (!secret) return { ok: true, mode: "no-secret" as const };

  if (!signature) return { ok: false, reason: "missing-signature" as const };

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return { ok: false, reason: "bad-signature" as const };

  const ok = crypto.timingSafeEqual(a, b);
  return ok ? { ok: true, mode: "hmac" as const } : { ok: false, reason: "bad-signature" as const };
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

    const amount_cents = typeof body.amount_cents === "number" ? body.amount_cents : null;
    const currency = (body.currency || "EUR").trim();
    const order_id = body.order_id ? String(body.order_id) : null;
    const metadata = body.metadata ?? null;

    // 1) Guardar evento (purchase_events)
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

    // Si ya existe por índice unique (idempotencia), devolvemos OK sin duplicar
    if (evErr) {
      // Postgres unique violation: 23505
      if ((evErr as any)?.code === "23505") {
        return NextResponse.json({
          ok: true,
          deduped: true,
          signature_mode: sigCheck.mode,
        });
      }

      console.error("[purchase] insert purchase_events error:", evErr);
      return NextResponse.json(
        { ok: false, error: "db-insert-failed", details: evErr.message },
        { status: 500 }
      );
    }

    // 2) Crear notificación REAL según tu esquema: (user_id, type, payload)
    const euros = typeof amount_cents === "number" ? (amount_cents / 100).toFixed(2) : null;

    const payload = {
      title: "Compra registrada",
      message: euros ? `Compra de ${euros} ${currency}` : "Compra registrada",
      company_id,
      order_id,
      amount_cents,
      currency,
      points_awarded: 2, // placeholder MVP
      metadata,
      purchase_event_id: ev.id,
      kind: "purchase",
    };

    const { error: nErr } = await supabaseAdmin.from("notifications").insert({
      user_id,
      type: "purchase",
      payload,
      read_at: null,
    });

    if (nErr) {
      console.warn("[purchase] insert notification warning:", nErr.message);
      // No rompemos el endpoint
    }

    // 3) (Opcional MVP) sumar score a la empresa: +1 por compra (controlado)
    // Si NO quieres tocar score aún, comenta este bloque.
    const { data: cp, error: cpErr } = await supabaseAdmin
      .from("company_profiles")
      .select("ethq_score")
      .eq("id", company_id)
      .single();

    if (!cpErr) {
      const current = typeof cp?.ethq_score === "number" ? cp.ethq_score : 0;
      const next = Math.max(0, Math.min(100, current + 1)); // +1 por compra (MVP)
      await supabaseAdmin.from("company_profiles").update({ ethq_score: next }).eq("id", company_id);
    }

    return NextResponse.json({
      ok: true,
      event_id: ev.id,
      created_at: ev.created_at,
      signature_mode: sigCheck.mode,
      notified_user: !nErr,
      company_score_bumped: !cpErr,
    });
  } catch (e: any) {
    console.error("[purchase] unexpected error:", e);
    return NextResponse.json({ ok: false, error: "unexpected", details: String(e?.message || e) }, { status: 500 });
  }
}
