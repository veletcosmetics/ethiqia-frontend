import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

function normalizeDomain(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const companyId = String(body.companyId || "");
    const domainRaw = String(body.domain || "");
    const userId = String(body.userId || "");

    if (!companyId || !domainRaw || !userId) {
      return NextResponse.json({ ok: false, error: "Faltan datos." }, { status: 400 });
    }

    const domain = normalizeDomain(domainRaw);
    if (!domain.includes(".") || domain.length < 4) {
      return NextResponse.json({ ok: false, error: "Dominio inválido." }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verificar que el user es owner (seguridad server-side)
    const { data: cp, error: cpErr } = await supabase
      .from("company_profiles")
      .select("id, owner_user_id")
      .eq("id", companyId)
      .single();

    if (cpErr || !cp) {
      return NextResponse.json({ ok: false, error: "Empresa no encontrada." }, { status: 404 });
    }
    if (cp.owner_user_id !== userId) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
    }

    // Token único
    const rand = crypto.randomBytes(16).toString("hex");
    const token = `ethiqia-verify=${companyId}_${rand}`;

    const { error: upErr } = await supabase
      .from("company_profiles")
      .update({
        domain,
        domain_verification_token: token,
        domain_verified: false,
        domain_verified_at: null,
      })
      .eq("id", companyId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      domain,
      txtHost: "ethiqia-verify",
      txtValue: token,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}
