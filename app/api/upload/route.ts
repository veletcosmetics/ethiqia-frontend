import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = "profile-media";

function extFromFile(file: File): string {
  const byType = file.type?.split("/")[1]?.toLowerCase();
  if (byType && ["png", "jpg", "jpeg", "webp"].includes(byType)) return byType === "jpeg" ? "jpg" : byType;

  const name = file.name || "";
  const m = name.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/);
  if (m?.[1]) return m[1] === "jpeg" ? "jpg" : m[1];

  return "jpg";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userData.user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") ?? "").toLowerCase(); // "avatar" | "cover"

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (kind !== "avatar" && kind !== "cover") {
      return NextResponse.json({ error: "Invalid kind (avatar|cover)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Límite básico (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }

    const ext = extFromFile(file);
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600",
      });

    if (upErr) {
      console.error("Upload error:", upErr);
      return NextResponse.json({ error: "Upload failed", details: upErr }, { status: 500 });
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ error: "No public URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (e) {
    console.error("Unexpected upload error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
