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

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || 8)));

    if (q.length < 2) return NextResponse.json({ users: [] }, { status: 200 });

    const pattern = `%${q}%`;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .or(`full_name.ilike.${pattern},username.ilike.${pattern}`)
      .limit(limit);

    if (error) {
      console.error("search-users error:", error);
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    return NextResponse.json({ users: data ?? [] }, { status: 200 });
  } catch (e) {
    console.error("GET /api/search-users unexpected:", e);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}
