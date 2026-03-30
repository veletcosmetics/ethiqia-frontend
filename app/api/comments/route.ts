import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase config missing: url=${url ? "OK" : "MISSING"}, serviceRoleKey=${key ? "OK" : "MISSING"}`
    );
  }

  return createClient(url, key);
}

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

// GET /api/comments?postId=xxx
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const postId = new URL(req.url).searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("id, post_id, user_id, content, created_at, profiles(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error loading comments:", error);
      return NextResponse.json(
        { error: "Error loading comments", details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: data ?? [] }, { status: 200 });
  } catch (e: any) {
    console.error("Unexpected error GET /api/comments:", e);
    return NextResponse.json(
      { error: "Unexpected error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// POST /api/comments  body: { postId, text }
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("Auth error:", userErr);
      return NextResponse.json(
        { error: "Invalid session", details: userErr?.message },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { postId, text } = body ?? {};

    if (!postId || !text?.trim()) {
      return NextResponse.json({ error: "postId y text son obligatorios" }, { status: 400 });
    }

    const userId = userData.user.id;
    const cleanText = text.trim().slice(0, 1000);

    // Moderacion IA antes de insertar
    try {
      const { moderatePost } = await import("@/lib/moderatePost");
      const modResult = await moderatePost({ text: cleanText });

      if (!modResult.allowed) {
        return NextResponse.json(
          { error: "Comentario rechazado por moderacion", reason: modResult.reason },
          { status: 403 }
        );
      }
    } catch (modErr) {
      // Si la moderacion falla (sin API key, rate limit, etc.), dejamos pasar
      console.warn("Comment moderation failed (non-blocking):", modErr);
    }

    const { data: comment, error: insertErr } = await supabaseAdmin
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content: cleanText,
      })
      .select("id, post_id, user_id, content, created_at")
      .single();

    if (insertErr) {
      console.error("Error inserting comment:", JSON.stringify(insertErr, null, 2));
      return NextResponse.json(
        {
          error: "Error creating comment",
          details: insertErr.message,
          code: insertErr.code,
          hint: insertErr.hint ?? null,
        },
        { status: 400 }
      );
    }

    // Cargar perfil del autor para devolver con el comentario
    const { data: authorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    const commentWithProfile = {
      ...comment,
      profiles: authorProfile ?? { full_name: null, avatar_url: null },
    };

    // Actualizar contador en posts (best-effort)
    try {
      await supabaseAdmin.rpc("increment_comments_count", { p_post_id: postId });
    } catch (rpcErr) {
      console.warn("increment_comments_count RPC failed (non-blocking):", rpcErr);
    }

    return NextResponse.json({ comment: commentWithProfile }, { status: 201 });
  } catch (e: any) {
    console.error("Unexpected error POST /api/comments:", e);
    return NextResponse.json(
      { error: "Unexpected error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
