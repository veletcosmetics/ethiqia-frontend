import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

type Kind = "followers" | "following";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get("userId") || "").trim();
    const kind = (searchParams.get("kind") || "").trim() as Kind;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (kind !== "followers" && kind !== "following") {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    // followers:   rows where following_id = userId -> return follower_id
    // following:   rows where follower_id  = userId -> return following_id
    const targetCol = kind === "followers" ? "follower_id" : "following_id";
    const filterCol = kind === "followers" ? "following_id" : "follower_id";

    const { data: rows, error: e1 } = await supabase
      .from("follows")
      .select(`${targetCol}`)
      .eq(filterCol, userId);

    if (e1) {
      return NextResponse.json(
        { error: "Error reading follows", details: e1 },
        { status: 500 }
      );
    }

    const ids = (rows ?? [])
      .map((r: any) => r?.[targetCol])
      .filter(Boolean) as string[];

    if (ids.length === 0) {
      return NextResponse.json({ users: [], total: 0 }, { status: 200 });
    }

    const { data: profiles, error: e2 } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);

    if (e2) {
      return NextResponse.json(
        { error: "Error reading profiles", details: e2 },
        { status: 500 }
      );
    }

    const map = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => {
      map.set(p.id, (p.full_name ?? "Usuario Ethiqia") as string);
    });

    const users = ids.map((id) => ({
      id,
      full_name: map.get(id) ?? "Usuario Ethiqia",
    }));

    return NextResponse.json({ users, total: ids.length }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
