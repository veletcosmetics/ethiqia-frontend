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

function maxDate(...dates: Array<Date | null | undefined>) {
  const filtered = dates.filter(Boolean) as Date[];
  if (filtered.length === 0) return new Date(0);
  return filtered.reduce((acc, d) => (d.getTime() > acc.getTime() ? d : acc), filtered[0]);
}

// GET /api/score -> Score v1 Usuario (Base 50 + hitos capados, sin puntos por post)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const now = new Date();
    const yearStartISO = isoYearStartUTC(now);
    const yearStart = new Date(yearStartISO);

    // IMPORTANTÍSIMO: evita backfill antes de que el usuario exista
    const userCreatedAt = user?.created_at ? new Date(user.created_at) : yearStart;

    // 1) Cargar eventos relevantes del año (ordenados DESC para last_event)
    const relevantTypes = [
      "profile_completed_min",
      "misconduct_strike",
      "conduct_quarter_awarded",
      "participation_milestone_awarded",
      "post_created", // solo tracking
    ];

    const { data: evs, error: evErr } = await supabaseAdmin
      .from("reputation_events")
      .select("id, event_type, points, created_at, metadata")
      .eq("subject_type", "user")
      .eq("subject_id", user.id)
      .gte("created_at", yearStartISO)
      .in("event_type", relevantTypes)
      .order("created_at", { ascending: false });

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

    // --- BLOQUE 2: Conducta
    // Strikes este año
    const strikes = events
      .filter((e) => e.event_type === "misconduct_strike")
      .map((e) => new Date(e.created_at))
      .sort((a, b) => a.getTime() - b.getTime());

    // Penalización inmediata por strikes
    const strikePenalty = Math.min(30, strikes.length * 10) * -1; // cap -30 (ajústalo)

    // "clean_start" real: desde que existe el usuario, inicio de año, y último strike (si hay)
    const lastStrike = strikes.length ? strikes[strikes.length - 1] : null;
    const cleanStart = maxDate(yearStart, userCreatedAt, lastStrike);

    const cleanDays = daysBetween(cleanStart, now);
    const cleanQuarters = Math.min(4, Math.floor(cleanDays / 90));

    // Eventos ya otorgados (por quarter_index único)
    const existingConductAwards = events.filter((e) => e.event_type === "conduct_quarter_awarded");
    const existingQuarterIdx = new Set<number>(
      existingConductAwards
        .map((e) => Number(e.metadata?.quarter_index))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 4)
    );

    // Debemos tener quarter_index 1..cleanQuarters
    const shouldHave = Array.from({ length: cleanQuarters }).map((_, i) => i + 1);
    const missingQuarterIdx = shouldHave.filter((q) => !existingQuarterIdx.has(q));

    if (missingQuarterIdx.length > 0) {
      const inserts = missingQuarterIdx.map((q) => ({
        subject_type: "user",
        subject_id: user.id,
        actor_user_id: user.id,
        event_type: "conduct_quarter_awarded",
        points: 2,
        metadata: {
          year: now.getUTCFullYear(),
          quarter_index: q,
          rule: "90_days_clean_from_clean_start",
          clean_start: cleanStart.toISOString(),
        },
      }));

      const { error: insErr } = await supabaseAdmin.from("reputation_events").insert(inserts);
      if (insErr) console.error("score: error insert conduct milestones", insErr);

      // Actualiza el set local para puntos
      missingQuarterIdx.forEach((q) => existingQuarterIdx.add(q));
    }

    const conductPoints = Math.min(8, existingQuarterIdx.size * 2);

    // --- BLOQUE 3: Participación (meses activos -> hitos 2/4/6/8/10/12, +1 cada uno, cap 6)
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
    const achievedMilestones = milestones.filter((m) => activeMonths >= m).slice(0, 6); // cap 6

    const existingPartAwards = events.filter((e) => e.event_type === "participation_milestone_awarded");
    const existingMilestones = new Set<number>(
      existingPartAwards
        .map((e) => Number(e.metadata?.milestone_months))
        .filter((n) => Number.isFinite(n))
    );

    const missingPart = achievedMilestones.filter((m) => !existingMilestones.has(m));

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

      missingPart.forEach((m) => existingMilestones.add(m));
    }

    const participationPoints = Math.min(6, existingMilestones.size);

    // --- SCORE FINAL
    const base = 50;
    let score = base + transparencyPoints + conductPoints + participationPoints + strikePenalty;
    score = Math.max(0, Math.min(100, score));

    // Progreso para UI
    const nextConduct =
      existingQuarterIdx.size >= 4
        ? null
        : (() => {
            const rem = 90 - (cleanDays % 90 || 0);
            const daysUntil = rem === 0 ? 90 : rem;
            return {
              clean_start: cleanStart.toISOString(),
              clean_days: cleanDays,
              days_until_next_quarter: daysUntil,
              quarters_earned: existingQuarterIdx.size,
            };
          })();

    const nextParticipation =
      existingMilestones.size >= 6
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
          clean_start: cleanStart.toISOString(),
          clean_days: cleanDays,
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
