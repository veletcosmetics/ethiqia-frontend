import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type ModerationResult = {
  aiProbability: number; // 0–100
  allowed: boolean;
  reason: string;
};

export async function moderatePost(options: {
  text?: string | null;
  imageUrl?: string | null;
}): Promise<ModerationResult> {
  const { text, imageUrl } = options;

  const userContent: Anthropic.MessageParam["content"] = [];

  if (imageUrl) {
    userContent.push({
      type: "image",
      source: {
        type: "url",
        url: imageUrl,
      },
    } as any);
  }

  userContent.push({
    type: "text",
    text: `Texto del post: ${text?.slice(0, 2000) || "(sin texto)"}`,
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: `Eres el sistema de moderación de contenido de Ethiqia, una red social de autenticidad.
Analiza el contenido (imagen y/o texto) y devuelve una evaluación de moderación.

RECHAZA el contenido (allowed: false) si contiene:
- Odio o discriminación por raza, género, religión, orientación sexual u otras características
- Bullying, acoso o humillación dirigida a personas reales
- Amenazas, violencia explícita o incitación al daño
- Contenido sexual con menores
- Apología del suicidio o autolesiones
- Desinformación dañina o spam malicioso

Si hay imagen, estima la probabilidad de que sea generada por IA:
- 0 = claramente fotografía real
- 100 = claramente generada por IA (Midjourney, DALL-E, Stable Diffusion, etc.)

Responde ÚNICAMENTE con JSON válido, sin texto adicional antes ni después:
{"ai_probability": number, "allowed": boolean, "reason": string}

El campo reason debe estar en el mismo idioma que el texto del post (español o inglés).
Si el contenido es aceptable: allowed=true, reason breve confirmación.
Si no es aceptable: allowed=false, reason explica el motivo con claridad.`,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Extrae el JSON si Claude añadió texto alrededor
    const match = raw.match(/\{[\s\S]*\}/);
    try {
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }
    if (!parsed) {
      parsed = { ai_probability: 0, allowed: true, reason: "fallback" };
    }
  }

  const aiProbability = Math.max(
    0,
    Math.min(100, Number(parsed.ai_probability ?? 0))
  );
  const allowed = parsed.allowed !== false;
  const reason =
    typeof parsed.reason === "string" ? parsed.reason : "Sin motivo detallado";

  return { aiProbability, allowed, reason };
}
