import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[/api/moderate-post] llamada recibida');
  console.log(
    '[/api/moderate-post] OPENAI_API_KEY presente:',
    !!process.env.OPENAI_API_KEY
  );

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada en el servidor' },
        { status: 500 }
      );
    }

    // … y a partir de aquí dejas el resto del código que ya tienes

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no configurada en el servidor' },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as { caption?: string } | null;
    const caption = body?.caption ?? '';

    if (!caption.trim()) {
      return NextResponse.json({
        allowed: true,
        flagged: false,
        reason: null,
        categories: null,
      });
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: caption,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error desde OpenAI Moderation:', text);
      return NextResponse.json(
        { error: 'Error llamando a la IA de moderación' },
        { status: 500 }
      );
    }

    const data = (await response.json()) as any;
    const result = data.results?.[0];

    if (!result) {
      return NextResponse.json(
        { error: 'Respuesta de moderación inesperada' },
        { status: 500 }
      );
    }

    const flagged: boolean = result.flagged;
    const categories = result.categories ?? {};
    const categoryScores = result.category_scores ?? {};

    let allowed = !flagged;
    let reason: string | null = null;

    if (flagged) {
      reason = 'El contenido ha sido marcado como potencialmente problemático por la IA.';
    }

    const highRisk =
      (categoryScores['hate'] ?? 0) > 0.5 ||
      (categoryScores['self-harm'] ?? 0) > 0.5 ||
      (categoryScores['sexual/minors'] ?? 0) > 0.1;

    if (highRisk) {
      allowed = false;
      reason =
        'El contenido vulnera las normas de Ethiqia (odio, autolesión o contenido sexual con menores).';
    }

    return NextResponse.json({
      allowed,
      flagged,
      reason,
      categories,
    });
  } catch (err) {
    console.error('Error en /api/moderate-post:', err);
    return NextResponse.json(
      { error: 'Error interno en moderación' },
      { status: 500 }
    );
  }
}
