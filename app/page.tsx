import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-semibold">
              E
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Ethiqia</div>
              <div className="text-xs text-neutral-400">Beta reputación ética</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/score-rules"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Info Score
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-neutral-700 bg-black px-4 py-2 text-xs font-semibold hover:border-neutral-500"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/feed"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-black"
            >
              Entrar al feed
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-emerald-400">
              Reputación · IA · Transparencia
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
              Ethiqia, el estándar de reputación digital{" "}
              <span className="text-emerald-400">para un mundo lleno de IA.</span>
            </h1>

            <p className="mt-4 text-neutral-300 leading-relaxed">
              Sube contenido y construye tu reputación con señales verificables. La plataforma
              analiza y etiqueta la probabilidad de IA, y te asigna un score que evoluciona por
              bloques (no por spam de acciones).
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-black"
              >
                Empezar
              </Link>

              <Link
                href="/feed"
                className="rounded-full border border-neutral-700 bg-black px-6 py-3 text-sm font-semibold hover:border-neutral-500"
              >
                Ver el feed
              </Link>

              <Link
                href="/score-rules"
                className="rounded-full border border-neutral-700 bg-black px-6 py-3 text-sm font-semibold hover:border-neutral-500"
              >
                Reglas del Score
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Análisis de imágenes (real/IA)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Likes y follows reales
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Score por bloques
              </div>
            </div>
          </div>

          {/* Card derecha */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">Estado actual</div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                Versión beta
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold">Producto operativo y listo para usuarios</div>

            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• Feed tipo Instagram con posts reales.</li>
              <li>• Perfil con seguidores/siguiendo y cierre de sesión.</li>
              <li>• Score por bloques (transparencia, conducta, participación).</li>
              <li>• Perfiles públicos (/u/id) navegables.</li>
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs text-neutral-400">Acción</div>
                <div className="mt-1 text-sm font-semibold">Crear cuenta</div>
                <div className="mt-2">
                  <Link href="/login" className="text-xs text-emerald-400 hover:text-emerald-300">
                    Ir a iniciar sesión →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-black p-4">
                <div className="text-xs text-neutral-400">Acción</div>
                <div className="mt-1 text-sm font-semibold">Entender el Score</div>
                <div className="mt-2">
                  <Link href="/score-rules" className="text-xs text-emerald-400 hover:text-emerald-300">
                    Ver reglas →
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-neutral-500">
              Nota: si no has iniciado sesión, algunas acciones te pedirán login.
            </div>
          </div>
        </div>
      </section>

      {/* Sección “Qué es” */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
            <h2 className="text-lg font-semibold">¿Qué es Ethiqia?</h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              Ethiqia es una capa de reputación digital diseñada para un entorno con contenido sintético,
              manipulación y ruido. En lugar de contar “likes”, introduce señales verificables y un score
              comprensible.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
            <h2 className="text-lg font-semibold">Transparencia frente a IA</h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              El objetivo no es “castigar”, sino aportar contexto: indicar probabilidad de IA,
              fomentar autenticidad y reducir incentivos al fraude.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
            <h2 className="text-lg font-semibold">Cómo se calcula el Score</h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              El Ethiqia Score empieza con una base y evoluciona por bloques: transparencia,
              buena conducta y participación por hitos (no por actividad constante).
            </p>
            <div className="mt-4">
              <Link href="/score-rules" className="text-xs text-emerald-400 hover:text-emerald-300">
                Ver reglas del Score →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} Ethiqia</span>
          <Link href="/investors" className="hover:text-neutral-300">
            Información para inversores →
          </Link>
        </div>
      </footer>
    </main>
  );
}
