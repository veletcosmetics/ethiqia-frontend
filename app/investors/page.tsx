import Link from "next/link";

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-neutral-800 bg-black/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-semibold">
              E
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Ethiqia</div>
              <div className="text-xs text-neutral-400">
                Landing para inversores / Parque Científico
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Volver a la landing pública
            </Link>
            <Link
              href="/feed"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-black"
            >
              Ver producto
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-emerald-400">
              Demo funcional · IA · Reputación
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
              Infraestructura de reputación verificable para internet
            </h1>

            <p className="mt-4 text-neutral-300 leading-relaxed">
              Esta versión está pensada para explicar la tesis: scoring por señales,
              verificación, penalización del contenido falso y APIs de integración
              con empresas/partners.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-black"
              >
                Ver demo operativa
              </Link>

              <Link
                href="/score"
                className="rounded-full border border-neutral-700 bg-black px-6 py-3 text-sm font-semibold hover:border-neutral-500"
              >
                Ver score
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
              <div className="text-sm font-semibold">Puntos clave</div>
              <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                <li>• Capa de confianza: reputación basada en pruebas, no en likes.</li>
                <li>• Verificación y penalización del contenido falso.</li>
                <li>• APIs: reputación por compras, eventos, validaciones externas.</li>
                <li>• Escalabilidad: más integraciones → más datos verificables.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
            <div className="text-sm text-neutral-400">Estado actual</div>
            <div className="mt-2 text-lg font-semibold">Producto ya operativo</div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• Feed con posts + análisis IA.</li>
              <li>• Likes y follows reales.</li>
              <li>• Perfiles públicos navegables.</li>
              <li>• Ruta de inversores separada de la app.</li>
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs text-neutral-400">Siguiente paso</div>
                <div className="mt-1 text-sm font-semibold">APIs externas</div>
                <div className="mt-2 text-xs text-neutral-400">
                  Compras, eventos, ESG, etc.
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs text-neutral-400">Siguiente paso</div>
                <div className="mt-1 text-sm font-semibold">Verificación avanzada</div>
                <div className="mt-2 text-xs text-neutral-400">
                  Firma digital, consentimiento, detección IA.
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-neutral-500">
              Aquí puedes ampliar con métricas, roadmap, uso de fondos y modelo de negocio.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-neutral-500">
          Ruta inversores: /investors — Ruta pública: /
        </div>
      </footer>
    </main>
  );
}
