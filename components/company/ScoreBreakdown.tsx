"use client";
import React from "react";

export const ScoreBreakdown = ({ items }: any) => {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-neutral-100 mb-4">
        Desglose del Ethiqia Score
      </h2>

      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/70"
          >
            <div className="flex justify-between">
              <p className="text-neutral-200 font-medium">{item.label}</p>
              <p className="text-neutral-400 text-sm">{item.value}/100</p>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

