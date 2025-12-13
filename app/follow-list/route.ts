import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

type Kind = "followers" | "following";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const kind = (searchParams.get("kind") || "") as Kind;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (kind !== "followers" && kind !== "following") {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    // 1) Sacar IDs desde follows
    const col = kind === "followers" ? "follower_id" : "following_id";
    const filterCol = kind === "followers" ? "following_id" : "follower_id";

    const { data: rows, error: e1 } = await supabase
      .from("follows")
      .select(`${col}, created_at`)
      .eq(filterCol, userId)
      .order("created_at", { ascending: false });

    if (e1) {
      return NextResponse.json(
        { error: "Error reading follows", details: e1 },
        { status: 500 }
      );
    }

    const ids = (rows ?? [])
      .map((r: any) => r?.[col])
      .filter(Boolean) as string[];

    if (ids.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // 2) Leer perfiles
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

    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => {
      nameById.set(p.id, (p.full_name ?? "Usuario Ethiqia") as string);
    });

    // 3) Mantener el orden (por created_at desc)
    const users = ids.map((id) => ({
      id,
      full_name: nameById.get(id) ?? "Usuario Ethiqia",
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
