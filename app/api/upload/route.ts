import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// Función simple para generar un score de IA en la demo
function generateAIScore() {
  const score = Math.floor(Math.random() * 40) + 60; // entre 60 y 100
  const label =
    score > 85 ? 'Real' :
    score > 70 ? 'Mixta / dudosa' :
    'Alta prob. IA';

  return { score, label };
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File | null;
    const caption = data.get('caption') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file received' },
        { status: 400 }
      );
    }

    // Convertir file a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Nombre único de archivo
    const fileName = `${Date.now()}-${file.name}`;

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from('ethiqia-images')
        .upload(fileName, buffer, {
          contentType: file.type,
        });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase
      .storage
      .from('ethiqia-images')
      .getPublicUrl(fileName);

    // Generar IA score simulado
    const { score, label } = generateAIScore();

    // Insertar en supabase.posts
    const { data: insertedPost, error: insertError } =
      await supabase
        .from('posts')
        .insert({
          image_url: publicUrl,
          caption: caption || '',
          ai_score: score,
          ai_label: label,
        })
        .select()
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        post: insertedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
