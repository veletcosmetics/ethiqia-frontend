"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

export const runtime = "nodejs";

type ScoreApiResponse = {
  userId: string;
  score: number;
  by_event?: Record<string, number>;
  days_active?: number;
  last_event?: string | null;

  // Opcionales (si tu /api/score los devuelve ahora o en el futuro)
  blocks?: Record<
    string,
    {
      label?: string;
      points?: number;
      max_points?: number;
      status?: "locked" | "in_progress" | "completed";
      details?: any;
    }
  >;
  next?: {
    title?: string;
    description?: string;
    hint?: string;
    action?: string;
    url?: string;
    [k: string]: any;
  };
  [k: string]: any;
};

function formatDateTime(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function scoreLabel(score: number) {
  if (score <= 0) return "Sin reputación aún";
  if (score < 20) return "Score inicial";
  if (score < 50) return "Score en crecimiento";
  if (score < 100) return "Score sólido";
  return "Score de alta confianza";
}

function prettyKey(k: string) {
  // Puedes ajustar nombres aquí si quieres UX más bonita
  const map: Record<string, string> = {
    account_created: "Cuenta creada",
    completed_min: "Perfil mínimo completado",
    post_created: "Publicación creada",
    ai_disclosed: "Transparencia IA declarada",
    clean_quarter_awarded: "Tramo limpio (90 días)",
    participation_milestone_awarded: "Hito participación (mes activo)",
    misconduct_strike: "Strike mala conducta",
  };
  return map[k] || k;
}

export default function ScorePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<ScoreApiResponse | null>(null);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        setError("Sesión inválida. Inicia sesión de nuevo.");
        setData(null);
        return;
      }

      const res = await fetch("/api/score", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        console.error("Score page: /api/score error", json);
        setError(json?.error || "No se ha podido cargar el score.");
        setData(null);
        return;
      }

      setData(json as ScoreApiResponse);
    } catch (e: any) {
      console.error("Score page: unexpected", e);
      setError(e?.message || "Error inesperado cargando el score.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = data?.score ?? 0;

  const byEventSorted = useMemo(() => {
    const obj = data?.by_event || {};
    return Object.entries(obj).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [data?.by_event]);

  const blocksSorted = useMemo(() => {
    const obj = data?.blocks || {};
    return Object.entries(obj);
  }, [data?.blocks]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Mi Ethiqia Score</h1>
            <div className="text-xs text-neutral-400 mt-1">
              Detalle del score real (vía /api/score)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Volver a mi perfil
            </Link>
            <Link
              href="/score-rules"
              className="rounded-full border border-neutral-800 bg-black px-4 py-2 text-xs font-semibold text-white hover:border-neutral-600"
            >
              Ver reglas
            </Link>
          </div>
        </div>

        {/* Estado */}
        {error ? (
          <div className="rounded-2xl border border-red-800/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
            <div className="mt-3">
              <button
                type="button"
                onClick={load}
                className="text-xs text-neutral-200 hover:text-white underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : null}

        {/* Card principal */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Ethiqia Score</div>
            <button
              type="button"
              onClick={load}
              className="text-xs text-neutral-400 hover:text-emerald-400"
              disabled={loading}
            >
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-neutral-400">Cargando…</div>
          ) : (
            <>
              <div className="mt-3 flex items-end gap-4">
                <div className="text-5xl font-semibold">{score}</div>
                <div className="pb-1">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    Ethiqia Score
                  </div>
                  <div className="text-sm text-neutral-200">{scoreLabel(score)}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-400">
                <div className="rounded-xl border border-neutral-800 bg-black p-3">
                  <div className="text-neutral-500">Días activos</div>
                  <div className="text-neutral-200 font-semibold mt-1">
                    {typeof data?.days_active === "number" ? data.days_active : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-black p-3">
                  <div className="text-neutral-500">Último evento</div>
                  <div className="text-neutral-200 font-semibold mt-1">
                    {formatDateTime(data?.last_event)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Qué te falta (si la API lo devuelve) */}
        {!loading && data?.next ? (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Siguiente paso recomendado</div>
            <div className="mt-2 text-sm text-neutral-200">
              {data.next.title || "Mejora tu reputación"}
            </div>
            {data.next.description ? (
              <div className="mt-2 text-sm text-neutral-300">{data.next.description}</div>
            ) : null}
            {data.next.hint ? (
              <div className="mt-2 text-xs text-neutral-400">{data.next.hint}</div>
            ) : null}

            {data.next.url ? (
              <div className="mt-4">
                <Link
                  href={data.next.url}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-semibold text-black"
                >
                  Ir ahora
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Bloques (si existen) */}
        {!loading && blocksSorted.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-sm font-semibold">Bloques del Score</div>
            <div className="mt-3 space-y-2">
              {blocksSorted.map(([key, b]) => {
                const label = b?.label || key;
                const points = typeof b?.points === "number" ? b.points : null;
                const max = typeof b?.max_points === "number" ? b.max_points : null;
                const status = b?.status || "in_progress";

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-neutral-800 bg-black px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-neutral-400">
                        {points !== null ? (
                          <>
                            {points}
                            {max !== null ? ` / ${max}` : ""} pts
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-neutral-500">
                      Estado:{" "}
                      <span className="text-neutral-300">
                        {status === "completed"
                          ? "Completado"
                          : status === "locked"
                          ? "Bloqueado"
                          : "En progreso"}
                      </span>
                    </div>

                    {max !== null && points !== null ? (
                      <div className="mt-3 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, (points / Math.max(1, max)) * 100))}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Desglose por tipo de evento */}
        {!loading ? (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Desglose por evento</div>
              <div className="text-xs text-neutral-500">Top</div>
            </div>

            {byEventSorted.length === 0 ? (
              <div className="mt-3 text-xs text-neutral-500">
                Aún no hay desglose por evento.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {byEventSorted.slice(0, 12).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs rounded-xl border border-neutral-800 bg-black px-4 py-3"
                  >
                    <span className="text-neutral-300">{prettyKey(k)}</span>
                    <span className={`font-semibold ${v >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {v > 0 ? `+${v}` : v}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-[11px] text-neutral-500">
              Nota: esto depende de lo que tu /api/score devuelva en <span className="text-neutral-300">by_event</span>.
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
