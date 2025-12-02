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
        "Eres un asistente de moderación para Ethiqia. Tu tarea es: 1) estimar la probabilidad de que la IMAGEN haya sido generada por IA, 2) evaluar si el contenido es aceptable según normas estándar (no odio, no violencia extrema, no menores sexualizados, no autolesiones), 3) devolver una respuesta estrictamente en JSON con las claves: ai_probability (0-100), allowed (true/false), reason (string).",
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
