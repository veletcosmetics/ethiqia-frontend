import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function requireUser(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return { user: null as any, error: "Missing Authorization Bearer token" };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { user: null as any, error: "Invalid session" };

  return { user: data.user, error: null as string | null };
}

function isoYearStartUTC(d: Date) {
  const y = d.getUTCFullYear();
  return new Date(Date.UTC(y, 0, 1, 0, 0, 0)).toISOString();
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function monthKeyUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// GET /api/score -> Score v1 Usuario (Base 50 + hitos capados, sin puntos por post)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const now = new Date();
    const yearStartISO = isoYearStartUTC(now);

    // 1) Cargar eventos relevantes del año
    const relevantTypes = [
      "profile_completed_min",
      "misconduct_strike",
      "conduct_quarter_awarded",
      "participation_milestone_awarded",
      "post_created", // solo para tracking (no sumamos puntos directos)
    ];

    const { data: evs, error: evErr } = await supabaseAdmin
      .from("reputation_events")
      .select("id, event_type, points, created_at, metadata")
      .eq("subject_type", "user")
      .eq("subject_id", user.id)
      .gte("created_at", yearStartISO)
      .in("event_type", relevantTypes);

    if (evErr) {
      console.error("score: error events", evErr);
      return NextResponse.json({ error: "Error cargando eventos" }, { status: 500 });
    }

    const events = (evs ?? []) as Array<{
      id: string;
      event_type: string;
      points: number | null;
      created_at: string;
      metadata: any;
    }>;

    // --- BLOQUE 1: Transparencia (+2 una vez)
    const hasProfileMin = events.some((e) => e.event_type === "profile_completed_min");
    const transparencyPoints = hasProfileMin ? 2 : 0;

    // --- BLOQUE 2: Conducta (hitos trimestrales +2, cap 4/año) + strikes -10 inmediato
    const strikes = events
      .filter((e) => e.event_type === "misconduct_strike")
      .map((e) => new Date(e.created_at))
      .sort((a, b) => a.getTime() - b.getTime());

    const strikePenalty = Math.min(30, strikes.length * 10) * -1; // cap de seguridad -30 (ajústalo si quieres)

    // Calcular cuántos "trimestres limpios" (90 días) ha conseguido este año, sumando segmentos limpios.
    const yearStart = new Date(yearStartISO);
    const segmentCuts = [yearStart, ...strikes, now];

    let cleanQuarters = 0;
    for (let i = 0; i < segmentCuts.length - 1; i++) {
      const start = segmentCuts[i];
      const end = segmentCuts[i + 1];
      const d = daysBetween(start, end);
      cleanQuarters += Math.floor(d / 90);
      if (cleanQuarters >= 4) {
        cleanQuarters = 4;
        break;
      }
    }

    // Eventos ya otorgados
    const existingConductAwards = events.filter((e) => e.event_type === "conduct_quarter_awarded");
    const awardedConductCount = Math.min(4, existingConductAwards.length);

    // Insertar eventos faltantes (idempotente por conteo)
    const missingConduct = Math.max(0, cleanQuarters - awardedConductCount);

    if (missingConduct > 0) {
      const inserts = Array.from({ length: missingConduct }).map((_, idx) => ({
        subject_type: "user",
        subject_id: user.id,
        actor_user_id: user.id,
        event_type: "conduct_quarter_awarded",
        points: 2,
        metadata: {
          year: now.getUTCFullYear(),
          quarter_index: awardedConductCount + idx + 1,
          rule: "90_days_clean",
        },
      }));

      const { error: insErr } = await supabaseAdmin.from("reputation_events").insert(inserts);
      if (insErr) console.error("score: error insert conduct milestones", insErr);
    }

    const conductPoints = Math.min(8, (awardedConductCount + missingConduct) * 2);

    // --- BLOQUE 3: Participación (meses activos -> hitos 2/4/6/8/10/12, +1 cada uno, cap 6)
    // Mes activo = existe al menos 1 post en ese mes (este año)
    const { data: postsData, error: postsErr } = await supabaseAdmin
      .from("posts")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", yearStartISO);

    if (postsErr) {
      console.error("score: error posts", postsErr);
      return NextResponse.json({ error: "Error cargando posts" }, { status: 500 });
    }

    const monthSet = new Set<string>();
    (postsData ?? []).forEach((p: any) => {
      const d = new Date(p.created_at);
      monthSet.add(monthKeyUTC(d));
    });

    const activeMonths = monthSet.size;
    const milestones = [2, 4, 6, 8, 10, 12];
    const achievedMilestones = milestones.filter((m) => activeMonths >= m);
    const achievedCount = Math.min(6, achievedMilestones.length);

    const existingPartAwards = events.filter((e) => e.event_type === "participation_milestone_awarded");
    // Guardamos milestones ya otorgados por metadata.milestone_months
    const existingMilestones = new Set<number>(
      existingPartAwards
        .map((e) => Number(e.metadata?.milestone_months))
        .filter((n) => Number.isFinite(n))
    );

    const missingPart = achievedMilestones.filter((m) => !existingMilestones.has(m)).slice(0, 6);

    if (missingPart.length > 0) {
      const inserts = missingPart.map((m) => ({
        subject_type: "user",
        subject_id: user.id,
        actor_user_id: user.id,
        event_type: "participation_milestone_awarded",
        points: 1,
        metadata: {
          year: now.getUTCFullYear(),
          milestone_months: m,
          rule: "active_months",
        },
      }));

      const { error: insErr } = await supabaseAdmin.from("reputation_events").insert(inserts);
      if (insErr) console.error("score: error insert participation milestones", insErr);
    }

    // Puntos de participación = nº de milestones otorgados (existentes + recién insertados), cap 6
    const participationPoints = Math.min(6, existingMilestones.size + missingPart.length);

    // --- SCORE FINAL
    const base = 50;
    let score = base + transparencyPoints + conductPoints + participationPoints + strikePenalty;
    score = Math.max(0, Math.min(100, score));

    // Progreso “próximo hito” para UI
    const nextConduct =
      (awardedConductCount + missingConduct) >= 4
        ? null
        : (() => {
            // Progreso desde el último corte (último strike o 1 enero)
            const lastCut = strikes.length ? strikes[strikes.length - 1] : yearStart;
            const d = daysBetween(lastCut, now);
            const rem = 90 - (d % 90);
            return { days_until_next_quarter: rem };
          })();

    const nextParticipation =
      achievedCount >= 6
        ? null
        : (() => {
            const nextM = milestones.find((m) => activeMonths < m) ?? null;
            return nextM ? { active_months: activeMonths, next_milestone_months: nextM } : null;
          })();

    return NextResponse.json(
      {
        userId: user.id,
        score,
        blocks: {
          base,
          transparency: transparencyPoints,
          conduct: conductPoints,
          participation: participationPoints,
          penalties: strikePenalty,
        },
        stats: {
          active_months: activeMonths,
          strikes_this_year: strikes.length,
        },
        next: {
          conduct: nextConduct,
          participation: nextParticipation,
        },
        last_event: events.length ? events[0].created_at : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("score: unexpected", err);
    return NextResponse.json({ error: "Error inesperado calculando score" }, { status: 500 });
  }
}
