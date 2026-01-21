import { NextResponse } from "next/server";
import { supabaseServerService } from "@/lib/supabaseServer";
import { randomToken, sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";

// userId de pruebas que ya tenemos guardado
const TEST_USER_ID = "5c9cd28d-e8e5-4f45-b06e-ec92181aa718";
const LABEL = "shortcuts_steps";

/**
 * Endpoint DEV:
 * Genera un token para Atajos (Shortcuts)
 * y lo guarda hasheado en Supabase.
 * Devuelve el token SOLO una vez.
 */
export async function POST() {
  const sb = supabaseServerService();

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const tokenPrefix = token.slice(0, 10);

  // Revoca tokens anteriores con la misma etiqueta
  await sb
    .from("user_webhook_tokens")
    .update({ is_revoked: true })
    .eq("user_id", TEST_USER_ID)
    .eq("label", LABEL);

  const { error } = await sb.from("user_webhook_tokens").insert({
    user_id: TEST_USER_ID,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    label: LABEL,
    is_revoked: false,
  });

  if (error) {
    return NextResponse.json(
      { error: "token_insert_failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user_id: TEST_USER_ID,
    label: LABEL,
    token, // ⚠️ solo se devuelve aquí
  });
}
