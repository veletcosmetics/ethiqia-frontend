import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { moderatePost } from "@/lib/moderatePost";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error GET /api/posts:", error);
    return NextResponse.json({ error: "Error cargando posts" }, { status: 500 });
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    authorName: "Usuario demo", // luego lo conectamos al perfil real
    createdAt: new Date(row.created_at).toLocaleString("es-ES"),
    text: row.text,
    imageUrl: row.image_url,
    aiProbability: row.ai_probability ?? 0,
    globalScore: row.global_score ?? 0,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, imageUrl, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Falta userId (usuario no autenticado)" },
        { status: 400 }
      );
    }

    const moderation = await moderatePost({ text, imageUrl });

    if (!moderation.allowed) {
      return NextResponse.json(
        {
          error: "Contenido bloqueado por moderación",
          reason: moderation.reason,
          aiProbability: moderation.aiProbability,
        },
        { status: 400 }
      );
    }

    const globalScore = 100 - moderation.aiProbability;

    const { data, error } = await supabaseServer
      .from("posts")
      .insert({
        user_id: userId,
        text,
        image_url: imageUrl,
        ai_probability: moderation.aiProbability,
        global_score: globalScore,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error insertando post:", error);
      return NextResponse.json(
        { error: "No se ha podido crear el post" },
        { status: 500 }
      );
    }

    const mapped = {
      id: data.id,
      authorName: "Usuario demo",
      createdAt: new Date(data.created_at).toLocaleString("es-ES"),
      text: data.text,
      imageUrl: data.image_url,
      aiProbability: data.ai_probability ?? 0,
      globalScore: data.global_score ?? 0,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (err) {
    console.error("Error inesperado en POST /api/posts:", err);
    return NextResponse.json(
      { error: "Error inesperado al crear el post" },
      { status: 500 }
    );
  }
}
