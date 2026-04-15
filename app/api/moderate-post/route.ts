import { NextRequest, NextResponse } from 'next/server';
import { moderatePost } from '@/lib/moderatePost';

export async function POST(req: NextRequest) {
  console.log('[/api/moderate-post] llamada recibida');
  console.log('[/api/moderate-post] ANTHROPIC_API_KEY presente:', !!process.env.ANTHROPIC_API_KEY);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[/api/moderate-post] ANTHROPIC_API_KEY no configurada — modo degradado');
    return NextResponse.json({
      allowed: true,
      blocked: false,
      aiProbability: 0,
      reason: 'Moderación desactivada (sin clave API)',
    });
  }

  const body = (await req.json().catch(() => null)) as {
    caption?: string;
    imageUrl?: string;
  } | null;

  const caption = body?.caption ?? '';
  const imageUrl = body?.imageUrl ?? null;

  if (!caption.trim() && !imageUrl) {
    return NextResponse.json({
      allowed: true,
      blocked: false,
      aiProbability: 0,
      reason: null,
    });
  }

  try {
    const result = await moderatePost({ text: caption, imageUrl });

    console.log('[/api/moderate-post] resultado:', result);

    return NextResponse.json({
      allowed: result.allowed,
      blocked: !result.allowed,
      aiProbability: result.aiProbability,
      reason: result.reason,
    });
  } catch (err: any) {
    console.error('[/api/moderate-post] error llamando a moderatePost:', err);

    const isRateLimit =
      err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.toLowerCase().includes('rate limit') ||
      err?.message?.toLowerCase().includes('quota');

    // Cualquier error de Anthropic → modo degradado, no bloquear
    console.warn('[/api/moderate-post] modo degradado por error:', err?.status ?? err?.message);
    return NextResponse.json({
      allowed: true,
      blocked: false,
      aiProbability: 0,
      reason: 'Moderacion IA no disponible temporalmente',
    });
  }
}
