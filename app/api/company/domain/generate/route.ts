import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function normalizeDomain(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const companyId = String(body.companyId || "").trim();
    const domainRaw = String(body.domain || "").trim();
    const userId = String(body.userId || "").trim();

    if (!companyId || !domainRaw || !userId) {
      return NextResponse.json({ ok: false, error: "Faltan campos: companyId, domain, userId." }, { status: 400 });
    }

    const domain = normalizeDomain(domainRaw);
    if (!domain || !domain.includes(".")) {
      return NextResponse.json({ ok: false, error: "Dominio inválido." }, { status: 400 });
    }

    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // 1) Comprobar que el userId es owner de esa company
    const { data: cp, error: cpErr } = await supabaseAdmin
      .from("company_profiles")
      .select("id, owner_user_id, handle")
      .eq("id", companyId)
      .maybeSingle();

    if (cpErr) {
      return NextResponse.json({ ok: false, error: cpErr.message }, { status: 500 });
    }
    if (!cp) {
      return NextResponse.json({ ok: false, error: "Empresa no encontrada." }, { status: 404 });
    }
    if (cp.owner_user_id !== userId) {
      return NextResponse.json({ ok: false, error: "No autorizado. No eres el owner." }, { status: 403 });
    }

    // 2) Generar token TXT
    // Formato: ethiqia-verify=<companyId>_<random>
    const rand = crypto.randomBytes(16).toString("hex");
    const txtValue = `ethiqia-verify=${companyId}_${rand}`;

    // 3) Guardar dominio + token y reset de verificación
    const { error: upErr } = await supabaseAdmin
      .from("company_profiles")
      .update({
        domain,
        domain_verification_token: txtValue,
        domain_verified: false,
        domain_verified_at: null,
      })
      .eq("id", companyId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      companyId,
      handle: cp.handle,
      domain,
      host: "ethiqia-verify",
      txtValue,
      instructions: {
        recordType: "TXT",
        host: "ethiqia-verify",
        value: txtValue,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}
