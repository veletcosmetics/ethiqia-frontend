import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// --- Moderacion basica por palabras clave (fallback sin IA) ---

const BLOCKED_WORDS = [
  // Español - insultos y odio
  "puta", "puto", "perra", "perro", "hijo de puta", "hdp", "hijueputa",
  "mierda", "imbecil", "imbécil", "idiota", "estupido", "estúpido",
  "subnormal", "retrasado", "mongolo", "mongólico",
  "maricón", "maricon", "marica", "bollera",
  "negro de mierda", "sudaca", "moro de mierda",
  "te voy a matar", "ojalá te mueras", "ojala te mueras",
  "vete a morir", "matate", "mátate", "suicidate", "suicídate",
  "zorra", "guarra", "gilipollas", "capullo", "cabrón", "cabron",
  "basura humana", "escoria",
  // Ingles - insultos y odio
  "fuck you", "fucking", "motherfucker", "asshole", "piece of shit",
  "bitch", "slut", "whore", "cunt",
  "retard", "retarded",
  "faggot", "fag", "dyke",
  "nigger", "nigga", "spic", "chink", "wetback", "kike",
  "kill yourself", "kys", "go die",
  "i will kill you", "gonna kill you",
];

function moderateByKeywords(text: string): { blocked: boolean; reason: string | null } {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const word of BLOCKED_WORDS) {
    const normalizedWord = word
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (normalized.includes(normalizedWord)) {
      return {
        blocked: true,
        reason:
          "Tu comentario contiene lenguaje que no esta permitido en Ethiqia. " +
          "Revisalo e intenta expresarte de forma respetuosa.",
      };
    }
  }

  return { blocked: false, reason: null };
}

// --- Supabase helpers ---

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
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");
    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    // Si solo piden el conteo
    if (url.searchParams.get("count") === "1") {
      const { count, error } = await supabaseAdmin
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      if (error) {
        return NextResponse.json({ count: 0 });
      }
      return NextResponse.json({ count: count ?? 0 });
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

    const comments = data ?? [];
    return NextResponse.json({ comments, count: comments.length }, { status: 200 });
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

    if (!userData.user.email_confirmed_at) {
      return NextResponse.json({ error: "Email no confirmado. Confirma tu email antes de comentar." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { postId, text } = body ?? {};

    if (!postId || !text?.trim()) {
      return NextResponse.json({ error: "postId y text son obligatorios" }, { status: 400 });
    }

    const userId = userData.user.id;
    const cleanText = text.trim().slice(0, 1000);

    // 1) Moderacion por palabras clave (siempre activa)
    const keywordCheck = moderateByKeywords(cleanText);
    if (keywordCheck.blocked) {
      console.log("[comments] Bloqueado por palabras clave, user:", userId);
      return NextResponse.json(
        { error: "Comentario rechazado por moderacion", reason: keywordCheck.reason },
        { status: 403 }
      );
    }

    // 2) Moderacion IA (opcional, no bloquea si falla)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { moderatePost } = await import("@/lib/moderatePost");
        const modResult = await moderatePost({ text: cleanText });
        if (!modResult.allowed) {
          console.log("[comments] Rechazado por IA:", modResult.reason);
          return NextResponse.json(
            { error: "Comentario rechazado por moderacion", reason: modResult.reason },
            { status: 403 }
          );
        }
      } catch (modErr: any) {
        console.warn("[comments] Moderacion IA no disponible:", modErr?.message);
      }
    }

    // 3) Insertar comentario
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

// DELETE /api/comments  body: { commentId }
export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { commentId } = body ?? {};

    if (!commentId) {
      return NextResponse.json({ error: "commentId es obligatorio" }, { status: 400 });
    }

    // Verificar que el comentario pertenece al usuario
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("comments")
      .select("id, post_id, user_id")
      .eq("id", commentId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    if (existing.user_id !== userData.user.id) {
      return NextResponse.json({ error: "No puedes borrar comentarios de otros usuarios" }, { status: 403 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (delErr) {
      console.error("Error deleting comment:", delErr);
      return NextResponse.json({ error: "Error borrando comentario" }, { status: 500 });
    }

    // Decrementar contador (best-effort)
    try {
      await supabaseAdmin.rpc("decrement_comments_count", { p_post_id: existing.post_id });
    } catch { /* no-op */ }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (e: any) {
    console.error("Unexpected error DELETE /api/comments:", e);
    return NextResponse.json(
      { error: "Unexpected error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
