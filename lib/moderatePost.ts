// lib/moderatePost.ts
import { openai } from "./openai";

export type ModerationResult = {
  aiProbability: number;   // 0–100
  allowed: boolean;
  reason: string;
};

export async function moderatePost(options: {
  text?: string | null;
  imageUrl?: string | null;
}): Promise<ModerationResult> {
  const { text, imageUrl } = options;

  const messages: any[] = [
    {
      role: "system",
      content:
        "Eres un sistema de moderación para Ethiqia. Debes: " +
        "1) Si se proporciona imagen, estimar la probabilidad (0-100) de que haya sido generada por IA (0=claramente real, 100=claramente IA). Si no hay imagen, usa 0. " +
        "2) Evaluar si el contenido (imagen y/o texto) cumple las normas: rechazar odio, violencia extrema, menores sexualizados, autolesiones o contenido gravemente ofensivo. " +
        "3) Responder ÚNICAMENTE con JSON válido con estas claves exactas: " +
        '{"ai_probability": number, "allowed": boolean, "reason": string}. ' +
        "Si el contenido es aceptable, allowed=true y reason explica brevemente. Si no, allowed=false y reason explica el motivo del rechazo.",
    },
  ];

  const userContent: any[] = [];

  if (imageUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl },
    });
  }

  userContent.push({
    type: "text",
    text:
      "Texto del post (puede estar vacío): " +
      (text?.slice(0, 2000) || "N/A"),
  });

  messages.push({
    role: "user",
    content: userContent,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { ai_probability: 0, allowed: true, reason: "fallback" };
  }

  const aiProbability = Math.max(
    0,
    Math.min(100, Number(parsed.ai_probability ?? 0))
  );

  const allowed = parsed.allowed !== false;
  const reason =
    typeof parsed.reason === "string" ? parsed.reason : "Sin motivo detallado";

  return {
    aiProbability,
    allowed,
    reason,
  };
}
