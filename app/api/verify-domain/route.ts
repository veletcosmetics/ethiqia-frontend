import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dns from "dns/promises";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase config missing");
  return createClient(url, key);
}

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

// POST /api/verify-domain  body: { handle }
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { handle } = body;
    if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

    const { data: company, error } = await supabase
      .from("company_profiles")
      .select("id, owner_user_id, website, domain_verification_token, domain_verified")
      .eq("handle", handle)
      .maybeSingle();

    if (error || !company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (company.owner_user_id !== userData.user.id) return NextResponse.json({ error: "Not owner" }, { status: 403 });
    if (company.domain_verified) return NextResponse.json({ verified: true, message: "Ya verificado" });

    const website = company.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    if (!website) return NextResponse.json({ error: "No website configured" }, { status: 400 });

    const expectedToken = company.domain_verification_token;
    if (!expectedToken) return NextResponse.json({ error: "No verification token" }, { status: 400 });

    // DNS TXT lookup
    try {
      const records = await dns.resolveTxt(website);
      const flat = records.map((r) => r.join(""));
      const found = flat.some((txt) => txt.includes(expectedToken));

      if (found) {
        await supabase.from("company_profiles").update({
          domain_verified: true,
          domain_verified_at: new Date().toISOString(),
        }).eq("handle", handle);
        return NextResponse.json({ verified: true, message: "Dominio verificado" });
      }

      return NextResponse.json({ verified: false, message: "Token no encontrado. Puede tardar hasta 24h en propagarse." });
    } catch (dnsErr: any) {
      return NextResponse.json({ verified: false, message: "No se pudo resolver DNS. Verifica que el dominio es correcto." });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
