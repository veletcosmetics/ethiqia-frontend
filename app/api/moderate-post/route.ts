import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Logs para comprobar que la ruta se ejecuta y que la API key está disponible
  console.log('[/api/moderate-post] llamada recibida');
  console.log(
    '[/api/moderate-post] OPENAI_API_KEY presente:',
    !!process.env.OPENAI_API_KEY
  );

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      // Modo degradado: permitir contenido si no hay clave (para no romper la UX)
      return NextResponse.json({
        allowed: true,
        flagged: false,
        reason: 'Moderación desactivada (sin clave en el servidor)',
        categories: null,
      });
    }

    const body = (await req.json().catch(() => null)) as { caption?: string } | null;
    const caption = body?.caption ?? '';

    if (!caption.trim()) {
      // Si no hay texto, de momento dejamos pasar (más adelante añadimos moderación de imagen)
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

    // 🔍 LOG CLAVE: qué devuelve OpenAI
    console.log(
      '[/api/moderate-post] respuesta OpenAI status:',
      response.status
    );

    // Si OpenAI devuelve error (por ejemplo 429 Too Many Requests o sin crédito)
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Error desde OpenAI Moderation:', text);

      // Si es límite de peticiones / sin crédito → modo degradado (dejamos pasar)
      if (response.status === 429 || text.includes('Too Many Requests')) {
        return NextResponse.json({
          allowed: true,
          flagged: false,
          reason: 'Moderación no disponible por límite de uso o falta de crédito',
          categories: null,
        });
      }

      // Otros errores: seguimos informando como error real
      return NextResponse.json(
        { error: 'Error llamando a la IA de moderación' },
        { status: 500 }
      );
    }

    const data = (await response.json()) as any;
    const result = data.results?.[0];

    if (!result) {
      console.error('Respuesta de moderación sin resultados:', data);
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

    // Reglas Ethiqia “duras”
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
    // Modo degradado ante cualquier excepción: no bloqueamos al usuario
    return NextResponse.json({
      allowed: true,
      flagged: false,
      reason: 'Moderación no disponible por error interno',
      categories: null,
    });
  }
}
