import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId),

      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

    if (followersRes.error) {
      return NextResponse.json(
        { error: "Error followers", details: followersRes.error },
        { status: 500 }
      );
    }

    if (followingRes.error) {
      return NextResponse.json(
        { error: "Error following", details: followingRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
