"use client";
import React, { useState } from "react";

const IMPROVE_TIPS: Record<string, string> = {
  "Transparencia": "Sube certificados oficiales, anade politica de privacidad, publica ingredientes completos de cada producto.",
  "Sostenibilidad": "Vincula Ecoembes, anade certificacion Vegan Society, documenta packaging reciclable y huella de carbono.",
  "Impacto social": "Anade colaboraciones con instituciones (universidades, ONGs), documenta programas sociales activos.",
  "Actividad verificada": "Conecta mas integraciones (Shopify, Stripe, WooCommerce), genera mas eventos verificados automaticamente.",
  "Confianza B2B": "Sube contratos activos con distribuidores, anade partners institucionales, registra en mas organismos regulatorios.",
};

export const ScoreBreakdown = ({ items }: any) => {
  const [openTip, setOpenTip] = useState<number | null>(null);

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
            <div className="flex justify-between items-baseline">
              <p className="text-neutral-200 font-medium">{item.label}</p>
              <p className="text-neutral-400 text-sm">{item.value}/100</p>
            </div>

            {item.description && (
              <p className="text-[11px] text-neutral-500 mt-1">{item.description}</p>
            )}

            <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${item.value}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => setOpenTip(openTip === i ? null : i)}
              className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {openTip === i ? "Ocultar consejos" : "Como mejorar?"}
            </button>

            {openTip === i && IMPROVE_TIPS[item.label] && (
              <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-neutral-300 leading-relaxed">
                {IMPROVE_TIPS[item.label]}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
