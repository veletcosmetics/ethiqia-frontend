import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resolver } from "dns/promises";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalizeDomain(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

async function getTxtRecords(hostname: string): Promise<string[]> {
  const resolver = new Resolver();
  // Usar resolvers públicos suele dar mejor resultado en Render
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);

  try {
    const records = await resolver.resolveTxt(hostname);
    // records: string[][] -> concatenamos cada TXT
    return records.map((chunks) => chunks.join(""));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const companyId = String(body.companyId || "").trim();
    const userId = String(body.userId || "").trim();

    if (!companyId || !userId) {
      return NextResponse.json({ ok: false, error: "Faltan campos: companyId, userId." }, { status: 400 });
    }

    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // 1) Leer empresa y comprobar owner
    const { data: cp, error: cpErr } = await supabaseAdmin
      .from("company_profiles")
      .select("id, owner_user_id, domain, domain_verification_token, domain_verified, handle")
      .eq("id", companyId)
      .maybeSingle();

    if (cpErr) return NextResponse.json({ ok: false, error: cpErr.message }, { status: 500 });
    if (!cp) return NextResponse.json({ ok: false, error: "Empresa no encontrada." }, { status: 404 });
    if (cp.owner_user_id !== userId) {
      return NextResponse.json({ ok: false, error: "No autorizado. No eres el owner." }, { status: 403 });
    }

    const domain = normalizeDomain(cp.domain || "");
    const token = String(cp.domain_verification_token || "").trim();

    if (!domain) {
      return NextResponse.json({ ok: false, error: "No hay dominio guardado. Genera TXT primero." }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ ok: false, error: "No hay token. Genera TXT primero." }, { status: 400 });
    }

    const host1 = `ethiqia-verify.${domain}`;
    const host2 = `_ethiqia-verify.${domain}`;

    // 2) Consultar DNS TXT
    const txt1 = await getTxtRecords(host1);
    const txt2 = txt1.length === 0 ? await getTxtRecords(host2) : [];
    const all = [...txt1, ...txt2];

    const found = all.some((v) => v.trim() === token);

    if (!found) {
      return NextResponse.json({
        ok: true,
        verified: false,
        checkedHost: txt1.length > 0 ? host1 : host2,
        seenTxt: all,
      });
    }

    // 3) Marcar verificado
    const { error: upErr } = await supabaseAdmin
      .from("company_profiles")
      .update({
        domain_verified: true,
        domain_verified_at: new Date().toISOString(),
        verification_level: "verified",
      })
      .eq("id", companyId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      checkedHost: txt1.length > 0 ? host1 : host2,
      handle: cp.handle,
      domain,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}
