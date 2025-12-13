import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con privilegios (solo servidor)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * POST /api/follow
 * Body: { followerId: string, followingId: string, action?: "follow" | "unfollow" }
 *
 * - Si action no viene, toggle: si existe => unfollow; si no => follow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { followerId, followingId, action } = body ?? {};

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "Faltan followerId o followingId" },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "No puedes seguirte a ti mismo" },
        { status: 400 }
      );
    }

    // ¿Existe ya el follow?
    const { data: existing, error: selectErr } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (selectErr) {
      console.error("Error comprobando follow:", selectErr);
      return NextResponse.json(
        { error: "Error comprobando follow", details: selectErr },
        { status: 500 }
      );
    }

    const isFollowing = Boolean(existing?.id);

    const finalAction: "follow" | "unfollow" =
      action === "follow" || action === "unfollow"
        ? action
        : isFollowing
        ? "unfollow"
        : "follow";

    if (finalAction === "follow") {
      if (isFollowing) {
        return NextResponse.json(
          { following: true, message: "Ya lo seguías" },
          { status: 200 }
        );
      }

      const { error: insErr } = await supabase.from("follows").insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (insErr) {
        console.error("Error creando follow:", insErr);
        return NextResponse.json(
          { error: "Error creando follow", details: insErr },
          { status: 400 }
        );
      }

      return NextResponse.json({ following: true }, { status: 201 });
    }

    // unfollow
    if (!isFollowing) {
      return NextResponse.json(
        { following: false, message: "No lo seguías" },
        { status: 200 }
      );
    }

    const { error: delErr } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (delErr) {
      console.error("Error borrando follow:", delErr);
      return NextResponse.json(
        { error: "Error borrando follow", details: delErr },
        { status: 400 }
      );
    }

    return NextResponse.json({ following: false }, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en POST /api/follow:", err);
    return NextResponse.json(
      { error: "Error inesperado en /api/follow" },
      { status: 500 }
    );
  }
}
