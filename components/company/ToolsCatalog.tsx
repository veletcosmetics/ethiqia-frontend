"use client";

import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";

type Tool = {
  key: string;
  name: string;
  category: string;
  pts: number;
};

type ActiveTool = {
  tool_key: string;
  status: "declared" | "verified";
};

const CATALOG: Tool[] = [
  // Pagos
  { key: "stripe", name: "Stripe", category: "pagos", pts: 10 },
  { key: "revolut", name: "Revolut", category: "pagos", pts: 8 },
  { key: "paypal", name: "PayPal", category: "pagos", pts: 5 },
  { key: "redsys", name: "Redsys", category: "pagos", pts: 8 },
  // IA y tecnologia
  { key: "claude", name: "Claude / Anthropic", category: "tecnologia", pts: 10 },
  { key: "chatgpt", name: "ChatGPT", category: "tecnologia", pts: 8 },
  { key: "canva", name: "Canva", category: "tecnologia", pts: 5 },
  { key: "notion", name: "Notion", category: "tecnologia", pts: 5 },
  { key: "hubspot", name: "HubSpot", category: "tecnologia", pts: 8 },
  // Ecommerce
  { key: "prestashop", name: "PrestaShop", category: "ecommerce", pts: 15 },
  { key: "shopify", name: "Shopify", category: "ecommerce", pts: 15 },
  { key: "woocommerce", name: "WooCommerce", category: "ecommerce", pts: 12 },
  { key: "amazon", name: "Amazon Seller", category: "ecommerce", pts: 8 },
  // Certificaciones
  { key: "cpnp", name: "CPNP (UE)", category: "certificacion", pts: 25 },
  { key: "fda", name: "FDA MOCRA", category: "certificacion", pts: 25 },
  { key: "iso9001", name: "ISO 9001", category: "certificacion", pts: 20 },
  { key: "iso14001", name: "ISO 14001", category: "certificacion", pts: 25 },
  { key: "ecocert", name: "Ecocert", category: "certificacion", pts: 30 },
  { key: "cosmos", name: "COSMOS Organic", category: "certificacion", pts: 30 },
  { key: "bcorp", name: "B Corp", category: "certificacion", pts: 35 },
  // Sostenibilidad
  { key: "ecoembes", name: "Ecoembes / Punto Verde", category: "sostenibilidad", pts: 20 },
  { key: "peta", name: "PETA Vegan", category: "sostenibilidad", pts: 25 },
  { key: "vegan_society", name: "The Vegan Society", category: "sostenibilidad", pts: 25 },
  { key: "carbon", name: "Carbon Footprint", category: "sostenibilidad", pts: 15 },
  { key: "ecolabel", name: "EU Ecolabel", category: "sostenibilidad", pts: 25 },
  { key: "fairtrade", name: "Comercio Justo", category: "sostenibilidad", pts: 20 },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: "ecommerce", label: "Ecommerce" },
  { key: "certificacion", label: "Certificaciones" },
  { key: "sostenibilidad", label: "Sostenibilidad" },
  { key: "pagos", label: "Pagos" },
  { key: "tecnologia", label: "IA y Tecnologia" },
];

const INITIALS: Record<string, string> = {
  stripe: "ST", revolut: "RV", paypal: "PP", redsys: "RS",
  claude: "AI", chatgpt: "GP", canva: "CA", notion: "NO", hubspot: "HS",
  prestashop: "PS", shopify: "SH", woocommerce: "WC", amazon: "AZ",
  cpnp: "EU", fda: "FD", iso9001: "9K", iso14001: "14", ecocert: "EC", cosmos: "CO", bcorp: "BC",
  ecoembes: "EM", peta: "PT", vegan_society: "VS", carbon: "CF", ecolabel: "EL", fairtrade: "FT",
};

const CAT_COLORS: Record<string, string> = {
  pagos: "bg-purple-600", tecnologia: "bg-sky-600", ecommerce: "bg-pink-600",
  certificacion: "bg-blue-700", sostenibilidad: "bg-emerald-700",
};

// Fallback data for Velet if company_tools table doesn't exist yet
const VELET_FALLBACK: ActiveTool[] = [
  { tool_key: "prestashop", status: "verified" },
  { tool_key: "cpnp", status: "verified" },
  { tool_key: "fda", status: "verified" },
  { tool_key: "ecoembes", status: "declared" },
  { tool_key: "claude", status: "declared" },
  { tool_key: "canva", status: "declared" },
  { tool_key: "peta", status: "declared" },
  { tool_key: "vegan_society", status: "declared" },
];

export function ToolsCatalog({ companyId, isAdmin }: { companyId: string; isAdmin: boolean }) {
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("ecommerce");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabaseBrowser
          .from("company_tools")
          .select("tool_key, status")
          .eq("company_id", companyId);

        if (!error && data && data.length > 0) {
          setActiveTools(data as ActiveTool[]);
        } else {
          // Fallback for Velet
          setActiveTools(VELET_FALLBACK);
        }
      } catch {
        setActiveTools(VELET_FALLBACK);
      }
      setLoaded(true);
    };
    load();
  }, [companyId]);

  const activeSet = new Set(activeTools.map((t) => t.tool_key));
  const statusMap = new Map(activeTools.map((t) => [t.tool_key, t.status]));

  const addTool = async (key: string) => {
    setToggling(key);
    try {
      await supabaseBrowser.from("company_tools").insert({
        company_id: companyId,
        tool_key: key,
        status: "declared",
      });
      setActiveTools((prev) => [...prev, { tool_key: key, status: "declared" }]);
    } catch { /* no-op */ }
    setToggling(null);
  };

  const removeTool = async (key: string) => {
    setToggling(key);
    try {
      await supabaseBrowser.from("company_tools").delete()
        .eq("company_id", companyId)
        .eq("tool_key", key);
      setActiveTools((prev) => prev.filter((t) => (t as any).tool_key !== key));
    } catch { /* no-op */ }
    setToggling(null);
  };

  if (!loaded) return null;

  // Visitor view: only active tools grouped by category
  if (!isAdmin) {
    const activeByCategory: Record<string, (Tool & { status: string })[]> = {};
    activeTools.forEach((at) => {
      const tool = CATALOG.find((c) => c.key === (at as any).tool_key);
      if (!tool) return;
      if (!activeByCategory[tool.category]) activeByCategory[tool.category] = [];
      activeByCategory[tool.category].push({ ...tool, status: at.status });
    });

    const cats = CATEGORIES.filter((c) => activeByCategory[c.key]?.length);
    if (cats.length === 0) return null;

    return (
      <section>
        <h2 className="text-sm font-semibold text-neutral-100 mb-3">Herramientas y certificaciones activas</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cats.flatMap((cat) =>
            activeByCategory[cat.key].map((tool) => (
              <div key={tool.key} className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3.5 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${CAT_COLORS[tool.category] ?? "bg-neutral-700"} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {INITIALS[tool.key] ?? tool.key.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-100">{tool.name}</p>
                  <p className={`text-[10px] font-medium ${tool.status === "verified" ? "text-emerald-400" : "text-amber-400"}`}>
                    {tool.status === "verified" ? "Verificado" : "Declarado"}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 shrink-0">+{tool.pts}</span>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  // Admin view: tabbed catalog
  const tabTools = CATALOG.filter((t) => t.category === activeTab);

  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-100 mb-3">Herramientas y certificaciones</h2>
      <p className="text-xs text-neutral-500 mb-4">Anade o quita herramientas. Las verificadas suman mas puntos al Ethiqia Score.</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveTab(cat.key)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              activeTab === cat.key
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-neutral-800/50 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="grid gap-2.5 md:grid-cols-2">
        {tabTools.map((tool) => {
          const isActive = activeSet.has(tool.key);
          const status = statusMap.get(tool.key);
          const busy = toggling === tool.key;

          return (
            <div key={tool.key} className={`rounded-xl border p-3.5 flex items-center gap-3 ${isActive ? "border-emerald-800/40 bg-emerald-500/5" : "border-neutral-800 bg-neutral-900/70"}`}>
              <div className={`h-9 w-9 rounded-lg ${CAT_COLORS[tool.category] ?? "bg-neutral-700"} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                {INITIALS[tool.key] ?? tool.key.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-100">{tool.name}</p>
                {isActive ? (
                  <p className={`text-[10px] font-medium ${status === "verified" ? "text-emerald-400" : "text-amber-400"}`}>
                    {status === "verified" ? "Verificado" : "Declarado"} · +{tool.pts} pts
                  </p>
                ) : (
                  <p className="text-[10px] text-neutral-500">+{tool.pts} pts al anadir</p>
                )}
              </div>
              {isActive ? (
                <button type="button" disabled={busy} onClick={() => removeTool(tool.key)}
                  className="text-[10px] text-red-400 hover:text-red-300 border border-red-900/30 rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-50">
                  {busy ? "..." : "Quitar"}
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => addTool(tool.key)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-50">
                  {busy ? "..." : "+ Anadir"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
