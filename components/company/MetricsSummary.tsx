"use client";
import React from "react";

export const MetricsSummary = ({ metrics }: any) => {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      {metrics.map((m: any, i: number) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2"
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-[0.16em]">
            {m.label}
          </p>

          <p className="text-3xl font-semibold text-emerald-400">
            {m.value}
            <span className="text-base text-neutral-500">/100</span>
          </p>

          <p className="text-[11px] text-neutral-500">{m.description}</p>
        </div>
      ))}
    </section>
  );
};

