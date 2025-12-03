import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { moderatePost } from "@/lib/moderatePost";

// GET: devuelve lista de posts para el feed
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error leyendo posts desde Supabase:", error);
      // Para la beta, si falla la tabla, devolvemos lista vacía
      return NextResponse.json([], { status: 200 });
    }

    const mapped =
      data?.map((row: any) => ({
        id: row.id ?? `temp-${Date.now()}-${Math.random()}`,
        authorName: row.author_name ?? "Usuario",
        createdAt: row.created_at
          ? new Date(row.created_at).toLocaleString("es-ES")
          : "",
        text: row.text ?? null,
        imageUrl: row.image_url ?? null,
        aiProbability: row.ai_probability ?? 0,
        globalScore: row.global_score ?? 0,
      })) ?? [];

    return NextResponse.json(mapped, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en GET /api/posts:", err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: crea un nuevo post con moderación de IA
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, imageUrl, userId } = body as {
      text?: string | null;
      imageUrl?: string | null;
      userId?: string | null;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Falta la imagen para crear el post" },
        { status: 400 }
      );
    }

    // 1) Moderación con IA
    const moderation = await moderatePost({
      text: text ?? "",
      imageUrl,
    });

    const aiProbability = moderation.aiProbability ?? 0;

    // Calculamos un Ethiqia Score simple para la beta:
    // a menor probabilidad de IA, mayor score.
    const globalScore = Math.max(0, Math.min(100, Math.round(100 - aiProbability)));

    const blocked = moderation.blocked ?? false;
    const reason = moderation.reason ?? null;

    // Si la IA decide bloquear, devolvemos 400 con la info
    if (blocked) {
      return NextResponse.json(
        {
          error: "Contenido bloqueado por moderación de IA",
          aiProbability,
          globalScore,
          reason,
        },
        { status: 400 }
      );
    }

    const createdAtIso = new Date().toISOString();

    // 2) Intentar guardar en Supabase
    let inserted: any | null = null;

    try {
      const { data, error } = await supabaseServer
        .from("posts")
        .insert({
          text: text ?? null,
          image_url: imageUrl,
          user_id: userId ?? null,
          ai_probability: aiProbability,
          global_score: globalScore,
          created_at: createdAtIso,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error insertando post en Supabase:", error);
      } else {
        inserted = data;
      }
    } catch (dbErr) {
      console.error("Error inesperado insertando post en Supabase:", dbErr);
    }

    // 3) Construir el objeto de respuesta aunque la inserción falle
    const responsePost = {
      id: inserted?.id ?? `temp-${Date.now()}`,
      authorName: inserted?.author_name ?? "Usuario demo",
      createdAt: inserted?.created_at
        ? new Date(inserted.created_at).toLocaleString("es-ES")
        : new Date(createdAtIso).toLocaleString("es-ES"),
      text: inserted?.text ?? text ?? null,
      imageUrl: inserted?.image_url ?? imageUrl ?? null,
      aiProbability: inserted?.ai_probability ?? aiProbability,
      globalScore: inserted?.global_score ?? globalScore,
    };

    return NextResponse.json(responsePost, { status: 200 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado al crear el post" },
      { status: 500 }
    );
  }
}
