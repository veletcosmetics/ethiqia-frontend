// app/api/upload-avatar/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    const supabase = supabaseServerClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${Date.now()}-${randomUUID()}.${ext}`;

    // Usamos el mismo bucket que las fotos de post (post-images)
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo avatar a Storage:", uploadError);
      return NextResponse.json(
        { error: "Error subiendo avatar a Storage" },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);

    if (!data?.publicUrl) {
      return NextResponse.json(
        { error: "No se pudo obtener la URL pública del avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicUrl: data.publicUrl,
      path,
    });
  } catch (err) {
    console.error("Error en /api/upload-avatar:", err);
    return NextResponse.json(
      { error: "Error interno al subir avatar" },
      { status: 500 }
    );
  }
}
