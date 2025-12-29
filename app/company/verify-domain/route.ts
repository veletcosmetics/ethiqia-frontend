import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dns from "dns/promises";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalizeDomain(input: string) {
  const s = (input || "").trim().toLowerCase();
  if (!s) return "";
  // quitar protocolo si lo ponen
  const noProto = s.replace(/^https?:\/\//, "");
  // quitar path si lo ponen
  const domainOnly = noProto.split("/")[0];
  // quitar www. (opcional)
  return domainOnly.replace(/^www\./, "");
}

function randomToken(len = 24) {
  return crypto.randomBytes(len).toString("hex");
}

async function getUserIdFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;

  const anonUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supaAnon = createClient(anonUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supaAnon.auth.getUser(m[1]);
  if (error || !data?.user) return null;
  return data.user.id;
}

function supabaseService() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * POST body:
 * - { companyId: string, domain: string } -> genera token y devuelve TXT record
 * - { companyId: string, domain: string, check: true } -> verifica DNS TXT y marca verificado
 */
export async function POST(req: Request) {
  try {
    const viewerId = await getUserIdFromAuthHeader(req);
    if (!viewerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const companyId = String(body.companyId || "");
    const domain = normalizeDomain(String(body.domain || ""));
    const check = Boolean(body.check);

    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 });
    }
    if (!domain) {
      return NextResponse.json({ error: "domain requerido" }, { status: 400 });
    }

    const supa = supabaseService();

    // 1) comprobar que la empresa existe y que el usuario es owner
    const { data: company, error: cErr } = await supa
      .from("company_profiles")
      .select("id, owner_user_id, verified, verification_level, domain_verification_token")
      .eq("id", companyId)
      .maybeSingle();

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }
    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }
    if (company.owner_user_id !== viewerId) {
      return NextResponse.json({ error: "Forbidden (no eres owner)" }, { status: 403 });
    }

    // 2) Si NO es check: generar token y guardarlo
    if (!check) {
      const token = randomToken(16);

      const { error: uErr } = await supa
        .from("company_profiles")
        .update({
          domain_verification_token: token,
          verification_level: "domain_pending",
          verified: false,
        })
        .eq("id", companyId);

      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 });
      }

      // TXT recomendado: ethq=... para poder buscarlo fácil
      const txtHost = `_ethiqia.${domain}`;
      const txtValue = `ethq=${token}`;

      return NextResponse.json({
        ok: true,
        step: "add_dns_txt",
        domain,
        companyId,
        instructions: {
          type: "TXT",
          host: `_ethiqia`, // en muchos paneles se pone solo el subdominio
          fullHost: txtHost,
          value: txtValue,
          note:
            "Añade el registro TXT y espera propagación DNS (a veces 5-30 min, a veces más). Luego pulsa 'Comprobar'.",
        },
      });
    }

    // 3) Si ES check: comprobar DNS TXT
    const expectedToken = String(company.domain_verification_token || "");
    if (!expectedToken) {
      return NextResponse.json(
        { error: "No hay token pendiente. Primero inicia la verificación (sin check)." },
        { status: 400 }
      );
    }

    const expected = `ethq=${expectedToken}`;
    const nameToQuery = `_ethiqia.${domain}`;

    let records: string[] = [];
    try {
      const ans = await dns.resolveTxt(nameToQuery);
      // ans: string[][] -> flatten
      records = ans.flat().map((x) => String(x));
    } catch (e: any) {
      // no encontrado / NXDOMAIN / etc
      return NextResponse.json({
        ok: false,
        verified: false,
        domain,
        checkedHost: nameToQuery,
        foundTxt: [],
        expectedTxt: expected,
        message:
          "No se encontró el TXT todavía. Revisa que el host sea _ethiqia y que el valor sea exacto.",
      });
    }

    const matched = records.some((r) => r.replace(/"/g, "") === expected);

    if (!matched) {
      return NextResponse.json({
        ok: false,
        verified: false,
        domain,
        checkedHost: nameToQuery,
        foundTxt: records,
        expectedTxt: expected,
        message:
          "Se encontraron TXT pero no coincide el token. Revisa el valor o espera a que propague.",
      });
    }

    // 4) marcar verificado
    const { error: vErr } = await supa
      .from("company_profiles")
      .update({
        verified: true,
        verification_level: "domain_verified",
        // opcional: limpiarlo
        // domain_verification_token: null,
      })
      .eq("id", companyId);

    if (vErr) {
      return NextResponse.json({ error: vErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      domain,
      companyId,
      message: "Dominio verificado correctamente.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
