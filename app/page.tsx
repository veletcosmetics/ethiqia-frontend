import Link from "next/link";

const ODS_BADGES = [
  { num: 3, label: "Salud y bienestar", color: "bg-green-600" },
  { num: 8, label: "Trabajo decente", color: "bg-red-700" },
  { num: 9, label: "Innovacion e infraestructura", color: "bg-orange-600" },
  { num: 12, label: "Produccion responsable", color: "bg-amber-700" },
  { num: 16, label: "Instituciones solidas", color: "bg-blue-700" },
];

const PRICING = [
  {
    name: "Free",
    price: "0",
    highlight: false,
    features: [
      "Perfil basico de empresa o persona",
      "Score Ethiqia en 5 dimensiones",
      "Badge Ethiqia publico",
      "3 herramientas vinculadas",
    ],
  },
  {
    name: "Premium",
    price: "49",
    highlight: true,
    features: [
      "Todo lo de Free",
      "Badge verificado premium",
      "Alineacion ODS automatica",
      "Informes PDF descargables",
      "API webhook en tiempo real",
      "Busquedas destacadas",
    ],
  },
  {
    name: "Enterprise",
    price: "199",
    highlight: false,
    features: [
      "Todo lo de Premium",
      "Informe ESG completo",
      "Verificacion manual por equipo Ethiqia",
      "Apto para fondos europeos y licitaciones",
      "Manager de cuenta dedicado",
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-neutral-800/60 bg-black/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">E</div>
            <span className="font-semibold text-sm">Ethiqia</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-xs text-neutral-300 hover:text-white transition-colors px-3 py-1.5">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 text-xs font-semibold transition-colors">
              Unirse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
            La red social donde empresas y personas demuestran que{" "}
            <span className="text-emerald-400">actuan bien.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Ethiqia verifica la actividad real de empresas con IA y datos. No palabras — evidencias.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-3 text-sm font-semibold transition-colors">
              Unirse gratis
            </Link>
            <Link href="/company/velet_cosmetics" className="rounded-full border border-neutral-700 hover:border-neutral-500 px-8 py-3 text-sm font-semibold text-neutral-200 transition-colors">
              Ver empresa ejemplo
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. DOS PUBLICOS ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-1">
              Empresas
            </div>
            <h2 className="text-xl font-semibold">Muestra tu impacto real</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Consigue el badge verificado. Genera informes ESG para fondos europeos.
              Demuestra con datos lo que otras marcas solo prometen con palabras.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-500/10 rounded-full px-3 py-1">
              Personas
            </div>
            <h2 className="text-xl font-semibold">Descubre empresas eticas</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Puntua tus acciones. Construye tu reputacion sostenible.
              Apoya a las empresas que realmente hacen las cosas bien.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. COMO FUNCIONA ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Registra tu empresa o perfil", desc: "Crea tu cuenta en menos de 2 minutos. Gratis para empezar." },
            { step: "02", title: "Vincula tu actividad real", desc: "Ventas, herramientas, certificaciones. Ethiqia verifica los datos automaticamente." },
            { step: "03", title: "Obtén tu Score y badge", desc: "Tu Ethiqia Score es publico y verificable. Demuestra tu impacto real." },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold mx-auto">
                {item.step}
              </div>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-sm text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. ODS Y FONDOS EUROPEOS ── */}
      <section className="bg-gradient-to-b from-emerald-950/30 to-black border-y border-neutral-800/40">
        <div className="max-w-5xl mx-auto px-4 py-20 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">Alineado con la Agenda 2030 de la ONU</h2>
            <p className="text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Tu Ethiqia Score se mapea automaticamente con los 17 Objetivos de Desarrollo Sostenible.
              Las empresas Enterprise generan informes ESG listos para licitaciones publicas,
              subvenciones europeas (Next Generation EU, FEDER) y auditorias de sostenibilidad.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ODS_BADGES.map((ods) => (
              <span key={ods.num} className={`${ods.color} rounded-full px-4 py-2 text-xs font-semibold text-white`}>
                ODS {ods.num} · {ods.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CASO REAL — VELET ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-3">Ya funcionando con empresas reales</h2>
        <p className="text-sm text-neutral-400 text-center max-w-xl mx-auto mb-10">
          Velet Cosmetics integra sus ventas de PrestaShop con Ethiqia en tiempo real.
          Cada compra genera puntos verificados.
        </p>
        <div className="max-w-md mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <div className="w-[100px] h-[50px] rounded-xl bg-[#111111] overflow-hidden flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-velet.png" alt="Velet Cosmetics" className="w-full h-full object-contain p-1.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Velet Cosmetics</span>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">✓ Verificada</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Cosmetica · Elche · Espana</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-emerald-400">84</div>
              <div className="text-[10px] text-neutral-500">/ 100</div>
            </div>
          </div>
          <div className="px-6 pb-5">
            <Link href="/company/velet_cosmetics" className="block w-full text-center rounded-full border border-neutral-700 hover:border-emerald-500 py-2 text-xs font-semibold text-neutral-200 hover:text-emerald-400 transition-colors">
              Ver perfil completo
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. PRECIOS ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Planes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                  : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              {plan.highlight && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 self-start mb-3">
                  POPULAR
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}€</span>
                <span className="text-xs text-neutral-500">/ mes</span>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-6 block text-center rounded-full py-2.5 text-xs font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "border border-neutral-700 hover:border-neutral-500 text-neutral-200"
                }`}
              >
                {plan.price === "0" ? "Empezar gratis" : "Elegir plan"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. FOOTER ── */}
      <footer className="border-t border-neutral-800/60 bg-neutral-950">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-base font-semibold">Tu empresa quiere estar en Ethiqia?</p>
            <a href="mailto:info.ethiqia@gmail.com" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              info.ethiqia@gmail.com
            </a>
          </div>
          <div className="flex justify-center gap-6 text-xs text-neutral-500">
            <Link href="/feed" className="hover:text-white transition-colors">Feed</Link>
            <Link href="/company/velet_cosmetics" className="hover:text-white transition-colors">Empresas</Link>
            <Link href="/score-rules" className="hover:text-white transition-colors">Reglas</Link>
          </div>
          <p className="text-center text-[11px] text-neutral-600">
            Ethiqia · Red social con moderacion IA · 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
