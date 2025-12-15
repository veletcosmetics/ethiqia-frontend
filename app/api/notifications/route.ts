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
  if (!token) return { token: null, user: null, error: "Missing Authorization Bearer token" };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { token, user: null, error: "Invalid session" };

  return { token, user: data.user, error: null };
}

// GET /api/notifications -> lista últimas notificaciones del usuario (unread primero)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));

    const { data, error: dbErr } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("read_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (dbErr) {
      console.error("Error cargando notifications:", dbErr);
      return NextResponse.json({ error: "Error cargando notifications", details: dbErr }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado GET /api/notifications:", err);
    return NextResponse.json({ error: "Error inesperado cargando notifications" }, { status: 500 });
  }
}

// POST /api/notifications -> marcar como leída (id / ids / all)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id, ids, markAllRead } = body || {};

    if (markAllRead) {
      const { error: upErr } = await supabaseAdmin
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (upErr) {
        console.error("Error markAllRead:", upErr);
        return NextResponse.json({ error: "Error marcando como leídas", details: upErr }, { status: 500 });
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const list: string[] = Array.isArray(ids) ? ids : id ? [id] : [];
    if (list.length === 0) {
      return NextResponse.json({ error: "Debes enviar id, ids o markAllRead" }, { status: 400 });
    }

    const { error: upErr } = await supabaseAdmin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("id", list);

    if (upErr) {
      console.error("Error marcando leídas:", upErr);
      return NextResponse.json({ error: "Error marcando como leída", details: upErr }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado POST /api/notifications:", err);
    return NextResponse.json({ error: "Error inesperado marcando notificación" }, { status: 500 });
  }
}
