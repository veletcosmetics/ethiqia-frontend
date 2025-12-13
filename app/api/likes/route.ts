import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con privilegios (solo en servidor). NO exponer en NEXT_PUBLIC_*
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * POST /api/likes
 * Body: { postId: string, userId: string, action?: "like" | "unlike" }
 *
 * - Si action no viene, hacemos "toggle": si existe like => borra; si no => crea
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, userId, action } = body ?? {};

    if (!postId || !userId) {
      return NextResponse.json(
        { error: "Faltan postId o userId" },
        { status: 400 }
      );
    }

    // 1) ¿Existe ya el like?
    const { data: existing, error: selectErr } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectErr) {
      console.error("Error comprobando like:", selectErr);
      return NextResponse.json(
        { error: "Error comprobando like", details: selectErr },
        { status: 500 }
      );
    }

    const hasLike = Boolean(existing?.id);

    // 2) Decide acción final
    const finalAction: "like" | "unlike" =
      action === "like" || action === "unlike"
        ? action
        : hasLike
        ? "unlike"
        : "like";

    if (finalAction === "like") {
      if (hasLike) {
        return NextResponse.json(
          { liked: true, message: "Ya estaba likeado" },
          { status: 200 }
        );
      }

      const { error: insErr } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      if (insErr) {
        console.error("Error insertando like:", insErr);
        return NextResponse.json(
          { error: "Error insertando like", details: insErr },
          { status: 400 }
        );
      }

      return NextResponse.json({ liked: true }, { status: 201 });
    }

    // finalAction === "unlike"
    if (!hasLike) {
      return NextResponse.json(
        { liked: false, message: "No había like" },
        { status: 200 }
      );
    }

    const { error: delErr } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (delErr) {
      console.error("Error borrando like:", delErr);
      return NextResponse.json(
        { error: "Error borrando like", details: delErr },
        { status: 400 }
      );
    }

    return NextResponse.json({ liked: false }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en POST /api/likes:", err);
    return NextResponse.json(
      { error: "Error inesperado en /api/likes" },
      { status: 500 }
    );
  }
}
