import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// BUCKET correcto (el que ya existe en tu proyecto)
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "profile-media";

export const runtime = "nodejs";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

// Para comprobar que la ruta existe
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/profile/upload", bucket: BUCKET }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    // Validar sesión del usuario con su JWT
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }

    // Admin para subir a Storage
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/jpeg"
        ? "jpg"
        : "bin";

    const path = `profiles/${user.id}/avatar-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
        cacheControl: "3600",
      });

    if (upErr) {
      console.error("Storage upload error:", upErr);
      return NextResponse.json(
        { error: "Upload failed", details: upErr.message, bucket: BUCKET, path },
        { status: 400 }
      );
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json(
        { error: "No public URL returned", bucket: BUCKET, path },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl, path, bucket: BUCKET }, { status: 200 });
  } catch (e: any) {
    console.error("Unexpected /api/profile/upload error:", e);
    return NextResponse.json(
      { error: "Unexpected error", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
