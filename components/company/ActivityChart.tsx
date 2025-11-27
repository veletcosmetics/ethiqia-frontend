"use client";

import React from "react";

export const ActivityChart = ({ data }: any) => {
  return (
    <section className="mt-12">
      <h2 className="text-sm font-semibold text-neutral-100 mb-3">
        Actividad mensual (demo)
      </h2>

      <div className="space-y-3">
        {data.map((item: any, i: number) => (
          <div key={i}>
            <div className="flex justify-between mb-1 text-xs text-neutral-400">
              <span>{item.month}</span>
              <span>{item.value}</span>
            </div>

            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

