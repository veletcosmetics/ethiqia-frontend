import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

// GET /api/comments?postId=xxx
export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const postId = new URL(req.url).searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("id, post_id, user_id, text, created_at, profiles(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading comments:", error);
      return NextResponse.json({ error: "Error loading comments" }, { status: 500 });
    }

    return NextResponse.json({ comments: data ?? [] }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error GET /api/comments:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// POST /api/comments  body: { postId, text }
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId, text } = body ?? {};

    if (!postId || !text?.trim()) {
      return NextResponse.json({ error: "postId y text son obligatorios" }, { status: 400 });
    }

    const { data: comment, error: insertErr } = await supabaseAdmin
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userData.user.id,
        text: text.trim().slice(0, 1000),
      })
      .select("id, post_id, user_id, text, created_at")
      .single();

    if (insertErr) {
      console.error("Error inserting comment:", insertErr);
      return NextResponse.json({ error: "Error creating comment" }, { status: 400 });
    }

    // Actualizar contador en posts (best-effort)
    try { await supabaseAdmin.rpc("increment_comments_count", { post_id: postId }); } catch { /* no-op */ }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (e) {
    console.error("Unexpected error POST /api/comments:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
