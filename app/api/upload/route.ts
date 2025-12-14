import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// BUCKET REAL PARA POSTS (según tu Supabase)
const BUCKET = "post-images";

function extFromFile(file: File): string {
  const byType = file.type?.split("/")[1]?.toLowerCase();
  if (byType && ["png", "jpg", "jpeg", "webp"].includes(byType)) {
    return byType === "jpeg" ? "jpg" : byType;
  }

  const name = file.name || "";
  const m = name.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/);
  if (m?.[1]) return m[1] === "jpeg" ? "jpg" : m[1];

  return "jpg";
}

export async function POST(req: NextRequest) {
  try {
    // 1) Exigir token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    // 2) Validar sesión con service role
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 3) Multipart
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // límite 8MB
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
    }

    // 4) Subir
    const ext = extFromFile(file);
    const path = `${userId}/post-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600",
      });

    if (upErr) {
      console.error("Storage upload error:", upErr);
      return NextResponse.json({ error: "Upload failed", details: upErr }, { status: 500 });
    }

    // 5) URL pública
    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ error: "No public URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl, path }, { status: 200 });
  } catch (e) {
    console.error("Unexpected upload error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
