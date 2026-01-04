import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dns from "dns/promises";

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
    const userId = String(body.userId || "");

    if (!companyId || !userId) {
      return NextResponse.json({ ok: false, error: "Faltan datos." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: cp, error: cpErr } = await supabase
      .from("company_profiles")
      .select("id, owner_user_id, domain, domain_verification_token")
      .eq("id", companyId)
      .single();

    if (cpErr || !cp) {
      return NextResponse.json({ ok: false, error: "Empresa no encontrada." }, { status: 404 });
    }
    if (cp.owner_user_id !== userId) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
    }

    const domain = normalizeDomain(cp.domain || "");
    const token = String(cp.domain_verification_token || "");
    if (!domain || !token) {
      return NextResponse.json({ ok: false, error: "Falta dominio o token. Genera el TXT primero." }, { status: 400 });
    }

    // El TXT está en ethiqia-verify.DOMINIO
    const fqdn = `ethiqia-verify.${domain}`;

    let records: string[] = [];
    try {
      const txt = await dns.resolveTxt(fqdn);
      // txt es array de arrays de strings
      records = txt.flat().map((x) => String(x));
    } catch {
      records = [];
    }

    const found = records.some((r) => r.includes(token));

    if (!found) {
      return NextResponse.json({
        ok: true,
        verified: false,
        checkedHost: fqdn,
        foundRecords: records,
      });
    }

    const { error: upErr } = await supabase
      .from("company_profiles")
      .update({
        domain_verified: true,
        domain_verified_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      checkedHost: fqdn,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}
