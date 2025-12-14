import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * IMPORTANTE:
 * - Debe ser el mismo bucket que ya te funciona en /api/upload.
 * - Si tu bucket NO se llama "uploads", cambia aquí el valor.
 */
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

export const runtime = "nodejs";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

// GET para comprobar que la ruta existe (evita dudas con 404/405)
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/profile/upload" }, { status: 200 });
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

    // Cliente con ANON para validar sesión del usuario usando su JWT
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

    // Validación básica de tipo (solo imágenes)
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Cliente ADMIN para subir a Storage
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
        {
          error: "No se ha podido obtener la URL pública del archivo",
          bucket: BUCKET,
          path,
        },
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
