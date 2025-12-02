// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Esta ruta recibe un `file` vía FormData y lo sube a Supabase Storage.
// Devuelve la URL pública de la imagen.
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se ha enviado ningún archivo" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // IMPORTANTE: cambia "images" por el nombre REAL de tu bucket de Supabase Storage
    const bucketName = "images";

    const { data, error } = await supabaseServer.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error subiendo archivo a Supabase:", error);
      return NextResponse.json(
        { error: "No se ha podido subir el archivo" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseServer.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    return NextResponse.json(
      {
        url: publicUrl,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error inesperado en /api/upload:", err);
    return NextResponse.json(
      { error: "Error inesperado al subir el archivo" },
      { status: 500 }
    );
  }
}
