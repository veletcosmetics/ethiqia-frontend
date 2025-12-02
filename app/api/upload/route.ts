// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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

    const bucketName =
      process.env.SUPABASE_BUCKET_NAME || "post-images";

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

    return NextResponse.json(
      {
        url: publicData.publicUrl,
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
