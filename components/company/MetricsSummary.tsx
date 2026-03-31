"use client";
import React from "react";

export const MetricsSummary = ({ metrics }: any) => {
  return (
    <section className="grid gap-4 grid-cols-2 md:grid-cols-5">
      {metrics.map((m: any, i: number) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-1.5"
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-[0.12em]">
            {m.label}
          </p>

          {m.link ? (
            <a
              href={m.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-emerald-400 hover:text-emerald-300 transition-colors block truncate"
            >
              {m.value}
            </a>
          ) : (
            <p className="text-2xl font-semibold text-emerald-400">
              {m.value}
            </p>
          )}

          {m.helper && (
            <p className="text-[11px] text-neutral-500">{m.helper}</p>
          )}
        </div>
      ))}
    </section>
  );
};
