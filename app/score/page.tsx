'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type ScoreBlocks = {
  base: number;
  transparency: number;
  conduct: number;
  participation: number;
  penalties: number; // negativo
};

type ScoreStats = {
  active_months: number;
  strikes_this_year: number;
  clean_start?: string;
  clean_days?: number;
};

type NextConduct =
  | null
  | {
      clean_start?: string;
      clean_days?: number;
      days_until_next_quarter: number;
      quarters_earned?: number;
    };

type NextParticipation =
  | null
  | {
      active_months: number;
      next_milestone_months: number;
    };

type ScoreApiResponse = {
  userId: string;
  score: number;
  blocks: ScoreBlocks;
  stats: ScoreStats;
  next: {
    conduct: NextConduct;
    participation: NextParticipation;
  };
  last_event?: string | null;
};

type NotificationPayload = {
  title?: string;
  body?: string;
  points_awarded?: number;
  points_delta?: number;
  [k: string]: any;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;

  // Esquema A
  payload?: NotificationPayload | null;

  // Esquema B (si aún quedan filas antiguas)
  title?: string | null;
  body?: string | null;
  points_awarded?: string | number | null;

  read_at: string | null;
  created_at: string;
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function fmtDelta(v: number) {
  if (v > 0) return `+${v}`;
  return `${v}`;
}

export default function ScorePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState<ScoreApiResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const totalScore = score?.score ?? 0;

  const label = useMemo(() => {
    // Ajustado a tu modelo: base=50, 100 casi inalcanzable
    if (totalScore <= 0) return 'Sin reputación (bloqueado por penalizaciones)';
    if (totalScore < 50) return 'Score dañado (penalizaciones activas)';
    if (totalScore === 50) return 'Base (usuario nuevo)';
    if (totalScore < 60) return 'Fundación (en progreso)';
    if (totalScore < 75) return 'Fundación sólida';
    if (totalScore < 90) return 'Confianza alta';
    if (totalScore < 98) return 'Confianza muy alta';
    return 'Elite (casi inalcanzable)';
  }, [totalScore]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/login');
        return;
      }

      // 1) Score consolidado por bloques
      const resScore = await fetch('/api/score', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const jsonScore = (await resScore.json().catch(() => ({}))) as any;

      if (!resScore.ok) {
        console.error('score error:', jsonScore);
        throw new Error(jsonScore?.error || 'Error cargando score');
      }
      setScore(jsonScore as ScoreApiResponse);

      // 2) Historial: usamos notificaciones (lo que el usuario “ve”)
      const resN = await fetch('/api/notifications?limit=30', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const jsonN = (await resN.json().catch(() => ({}))) as any;

      if (resN.ok) {
        setNotifications((jsonN.notifications ?? []) as NotificationRow[]);
      } else {
        // no bloquea la pantalla si falla
        console.error('notifications error:', jsonN);
        setNotifications([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Error cargando score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breakdown = score?.blocks;

  const conductNext = score?.next?.conduct ?? null;
  const participationNext = score?.next?.participation ?? null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Mi Ethiqia Score</h1>
            <p className="text-xs text-neutral-400">
              Score consolidado por bloques (no gamificación por interacción).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Volver al feed
            </Link>
            <button
              type="button"
              onClick={loadAll}
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
              disabled={loading}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Main card */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          {loading ? (
            <div className="text-sm text-neutral-400">Calculando…</div>
          ) : error ? (
            <div className="text-sm text-red-400">Error: {error}</div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-400">Ethiqia Score</div>
                  <div className="mt-2 flex items-end gap-3">
                    <div className="text-5xl font-semibold">{totalScore}</div>
                    <div className="pb-1 text-sm text-neutral-300">{label}</div>
                  </div>
                </div>

                <div className="text-right text-xs text-neutral-500">
                  <div>Usuario: {score?.userId?.slice(0, 8)}…</div>
                  <div>
                    Último evento:{' '}
                    {score?.last_event ? new Date(score.last_event).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-800 bg-black p-4">
                  <div className="text-xs text-neutral-400">Bloques</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <Row label="Base" value={n(breakdown?.base)} />
                    <Row label="Transparencia" value={n(breakdown?.transparency)} />
                    <Row label="Conducta" value={n(breakdown?.conduct)} />
                    <Row label="Participación" value={n(breakdown?.participation)} />
                    <Row label="Penalizaciones" value={n(breakdown?.penalties)} negative />
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-500">
                    Transparencia y conducta se consolidan por hitos (capadas). Las penalizaciones restan al instante.
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-black p-4">
                  <div className="text-xs text-neutral-400">Progreso</div>

                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-neutral-800 p-3">
                      <div className="text-xs font-semibold">Conducta</div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Strikes este año: {n(score?.stats?.strikes_this_year)}
                      </div>
                      {conductNext ? (
                        <div className="text-xs text-neutral-300 mt-2">
                          Próximo hito en{' '}
                          <span className="font-semibold">{conductNext.days_until_next_quarter}</span> días.
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 mt-2">Hitos de conducta completados este año.</div>
                      )}
                    </div>

                    <div className="rounded-lg border border-neutral-800 p-3">
                      <div className="text-xs font-semibold">Participación</div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Meses activos: {n(score?.stats?.active_months)}
                      </div>
                      {participationNext ? (
                        <div className="text-xs text-neutral-300 mt-2">
                          Siguiente hito al llegar a{' '}
                          <span className="font-semibold">{participationNext.next_milestone_months}</span> meses activos.
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 mt-2">Hitos de participación completados este año.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-500">
                    Nota: participación puntúa por “mes activo”, no por cada acción.
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* History */}
        <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Historial reciente</h2>
            <span className="text-xs text-neutral-500">desde notificaciones</span>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-neutral-400">Cargando…</p>
          ) : notifications.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Aún no hay movimientos visibles.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notifications.slice(0, 20).map((nrow) => {
                const title = nrow.payload?.title || nrow.title || nrow.type;

                const body =
                  nrow.payload?.body ||
                  nrow.body ||
                  '';

                const delta =
                  typeof nrow.payload?.points_delta === 'number'
                    ? nrow.payload.points_delta
                    : typeof nrow.payload?.points_awarded === 'number'
                    ? nrow.payload.points_awarded
                    : nrow.points_awarded !== null && typeof nrow.points_awarded !== 'undefined'
                    ? n(nrow.points_awarded)
                    : null;

                return (
                  <li
                    key={nrow.id}
                    className={`rounded-xl border px-3 py-3 ${
                      nrow.read_at ? 'border-neutral-800 bg-black' : 'border-emerald-700/40 bg-emerald-500/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{title}</div>
                        {body ? <div className="text-xs text-neutral-300 mt-1">{body}</div> : null}
                        <div className="text-[11px] text-neutral-500 mt-2">
                          {new Date(nrow.created_at).toLocaleString()}
                        </div>
                      </div>

                      {delta !== null ? (
                        <div className={`text-xs font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtDelta(delta)}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Footer hint */}
        <div className="mt-6 text-xs text-neutral-500">
          Siguiente paso recomendado: crear la página “Reglas del Score” (explica bloques, caps, y por qué no se gamifica por likes).
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  const sign = value > 0 ? `+${value}` : `${value}`;
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-300">{label}</span>
      <span className={`font-semibold ${negative && value < 0 ? 'text-red-400' : 'text-neutral-100'}`}>
        {sign}
      </span>
    </div>
  );
}
