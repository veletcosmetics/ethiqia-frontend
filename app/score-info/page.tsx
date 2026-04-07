import Link from "next/link";

const USER_RULES = [
  {
    title: "Participa",
    max: 30,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    items: [
      { action: "Publica un post", pts: "+5 pts", note: "max 3 posts/dia" },
      { action: "Comenta o interactua", pts: "+2 pts", note: null },
      { action: "Semana activa (7 dias consecutivos)", pts: "+5 pts", note: null },
    ],
  },
  {
    title: "Se real",
    max: 30,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    items: [
      { action: "Email verificado", pts: "+10 pts", note: null },
      { action: "Perfil completo (foto, bio, ubicacion)", pts: "+10 pts", note: null },
      { action: "Declara contenido IA", pts: "+10 pts", note: null },
    ],
  },
  {
    title: "Actua bien",
    max: 30,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    items: [
      { action: "Compra en empresa verificada Ethiqia", pts: "+10 pts", note: null },
      { action: "90 dias sin infracciones", pts: "+10 pts", note: null },
    ],
  },
];

const PENALTIES = [
  { action: "Contenido inapropiado (detectado por IA)", pts: "-20 pts" },
  { action: "Discurso de odio", pts: "-50 pts" },
];

const COMPANY_DIMS = [
  {
    title: "Transparencia",
    max: 100,
    items: [
      { action: "Registros CPNP/FDA activos", pts: "+20 c/u" },
      { action: "Politica de privacidad publicada", pts: "+10" },
      { action: "Ingredientes visibles", pts: "+10" },
    ],
  },
  {
    title: "Sostenibilidad",
    max: 100,
    items: [
      { action: "Certificacion vegana", pts: "+30" },
      { action: "Ecoembes / Punto Verde", pts: "+20" },
      { action: "Packaging reciclable", pts: "+10" },
    ],
  },
  {
    title: "Impacto social",
    max: 100,
    items: [
      { action: "Forma cooperativa o B Corp", pts: "+25" },
      { action: "Colaboracion con instituciones", pts: "+20" },
      { action: "Programas sociales activos", pts: "+15" },
    ],
  },
  {
    title: "Actividad verificada",
    max: 100,
    items: [
      { action: "Integracion PrestaShop/Shopify activa", pts: "+30" },
      { action: "Eventos verificados en tiempo real", pts: "+5/evento" },
      { action: "API webhook funcionando", pts: "+10" },
    ],
  },
  {
    title: "Confianza B2B",
    max: 100,
    items: [
      { action: "Sede en parque cientifico", pts: "+20" },
      { action: "Contratos activos subidos", pts: "+15" },
      { action: "Partners institucionales", pts: "+10" },
    ],
  },
];

const LEVELS = [
  { name: "Nuevo", range: "0-20", color: "bg-neutral-600", text: "text-neutral-300" },
  { name: "Activo", range: "21-40", color: "bg-sky-600", text: "text-sky-300" },
  { name: "Confiable", range: "41-60", color: "bg-emerald-600", text: "text-emerald-300" },
  { name: "Verificado", range: "61-80", color: "bg-purple-600", text: "text-purple-300" },
  { name: "Referente", range: "81-100", color: "bg-amber-500", text: "text-amber-300" },
];

export default function ScoreInfoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        {/* HEADER */}
        <section className="text-center space-y-4">
          <Link href="/" className="text-xs text-neutral-500 hover:text-emerald-400 transition-colors">← Inicio</Link>
          <h1 className="text-3xl sm:text-4xl font-bold mt-4">Como funciona el Ethiqia Score?</h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Un sistema transparente que premia las acciones reales y penaliza el mal comportamiento automaticamente con IA.
          </p>
        </section>

        {/* USUARIOS */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold">Para usuarios</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {USER_RULES.map((cat) => (
              <div key={cat.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${cat.color}`}>{cat.title}</span>
                  <span className={`text-[10px] font-medium ${cat.color} ${cat.bg} rounded-full px-2 py-0.5`}>max {cat.max} pts</span>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <p className="text-xs text-neutral-300 leading-snug">{item.action}</p>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-emerald-400">{item.pts}</span>
                        {item.note && <p className="text-[10px] text-neutral-600">{item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Penalizaciones */}
          <div className="rounded-2xl border border-red-900/40 bg-red-500/5 p-5 space-y-3">
            <span className="text-sm font-semibold text-red-400">Penalizaciones</span>
            <div className="space-y-2">
              {PENALTIES.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs text-neutral-300">{p.action}</p>
                  <span className="text-xs font-semibold text-red-400">{p.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EMPRESAS */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold">Para empresas — 5 dimensiones</h2>

          <div className="space-y-4">
            {COMPANY_DIMS.map((dim) => (
              <div key={dim.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-neutral-100">{dim.title}</span>
                  <span className="text-[10px] text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">max {dim.max}</span>
                </div>
                <div className="space-y-2">
                  {dim.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400">{item.action}</p>
                      <span className="text-xs font-semibold text-emerald-400">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NIVELES */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold">Niveles de reputacion</h2>
          <p className="text-xs text-neutral-400">Aplica tanto a usuarios como a empresas.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {LEVELS.map((lvl) => (
              <div key={lvl.name} className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center space-y-2">
                <div className={`inline-block w-4 h-4 rounded-full ${lvl.color}`} />
                <p className={`text-sm font-semibold ${lvl.text}`}>{lvl.name}</p>
                <p className="text-xs text-neutral-500">{lvl.range} pts</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <p className="text-lg font-semibold">Tu empresa quiere estar en Ethiqia?</p>
          <Link href="/register" className="inline-block rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-3 text-sm font-semibold transition-colors">
            Registrarse gratis
          </Link>
        </section>
      </div>
    </main>
  );
}
