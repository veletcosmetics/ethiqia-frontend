import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // tienes que tenerlo (service role)

function getRawBody(req: Request): Promise<string> {
  return req.text();
}

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  try {
    const secret = process.env.ETHIQIA_EVENTS_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Missing ETHIQIA_EVENTS_SECRET" }, { status: 500 });
    }

    const signature = req.headers.get("x-ethiqia-signature") || "";
    const raw = await getRawBody(req);

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!signature || !timingSafeEqual(signature, expected)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);

    /**
     * body esperado:
     * {
     *   event_id: "unique-id-from-velet",
     *   buyer_user_id: "ethiqia-user-uuid",
     *   company_id: "company-uuid",
     *   amount_cents: 12345,
     *   currency: "EUR",
     *   order_ref: "VELET-ORDER-123",
     *   purchased_at: "ISO date",
     *   metadata: { vegan: true, eco: true }
     * }
     */

    // Idempotencia: no duplicar si event_id ya existe
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("purchase_events")
      .select("id")
      .eq("event_id", body.event_id)
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ ok: false, error: exErr.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ ok: true, duplicated: true });
    }

    // 1) Guardar evento
    const { data: ins, error: insErr } = await supabaseAdmin
      .from("purchase_events")
      .insert({
        event_id: body.event_id,
        buyer_user_id: body.buyer_user_id,
        company_id: body.company_id,
        amount_cents: body.amount_cents,
        currency: body.currency || "EUR",
        order_ref: body.order_ref,
        purchased_at: body.purchased_at || new Date().toISOString(),
        metadata: body.metadata || {},
      })
      .select("id")
      .single();

    if (insErr) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }

    // 2) Calcular puntos (ejemplo simple)
    const vegan = !!body?.metadata?.vegan;
    const eco = !!body?.metadata?.eco;

    let points = 0;
    points += 5; // base por compra verificada
    if (vegan) points += 3;
    if (eco) points += 2;

    // 3) Crear notificación
    await supabaseAdmin.from("notifications").insert({
      user_id: body.buyer_user_id,
      type: "purchase_verified",
      payload: {
        title: "Compra verificada",
        body: `Compra verificada en empresa (${body.order_ref || "pedido"}). +${points} puntos.`,
        points_awarded: points,
        company_id: body.company_id,
        order_ref: body.order_ref,
      },
      created_at: new Date().toISOString(),
    });

    // 4) Sumar puntos al score (si usas scoring_events)
    await supabaseAdmin.from("scoring_events").insert({
      user_id: body.buyer_user_id,
      event_type: "purchase_verified",
      points_awarded: points,
      metadata: { company_id: body.company_id, order_ref: body.order_ref, vegan, eco },
    });

    return NextResponse.json({ ok: true, points_awarded: points, purchase_event_id: ins.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
