import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto max-w-5xl px-4 py-10 space-y-16">
        {/* HERO PRINCIPAL */}
        <section className="grid gap-10 md:grid-cols-[1.3fr,1fr] items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
              Demo funcional · IA · Reputación
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Ethiqia, la capa de reputación digital
              <span className="block text-emerald-300">
                para un mundo lleno de IA.
              </span>
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl">
              Ethiqia combina análisis de imágenes con IA, moderación
              automática y un score de reputación por bloques. Lo que ves aquí
              es una demo funcional pensada para inversores, parques científicos
              y convocatorias públicas.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/feed"
                className="rounded-full bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400"
              >
                Ver demo tipo Instagram
              </Link>
              <Link
                href="/score"
                className="rounded-full border border-neutral-700 px-4 py-2 text-neutral-100 hover:border-emerald-400 hover:text-emerald-300"
              >
                Ver Ethiqia Score
              </Link>
              <Link
                href="/monetizar"
                className="text-xs text-neutral-400 hover:text-emerald-300"
              >
                Info para inversores →
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-neutral-500">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Analiza imágenes (real / IA) en la demo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Moderación automática de comentarios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Score de reputación por bloques</span>
              </div>
            </div>
          </div>

          {/* Tarjeta resumen lado derecho */}
          <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Estado actual</p>
                <p className="text-sm font-semibold text-neutral-100">
                  Demo funcional Ethiqia
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300 border border-emerald-500/40">
                α · Versión demo
              </span>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <p>
                • Feed tipo Instagram con análisis IA y likes dinámicos. <br />
                • Subida de imágenes en tiempo real para enseñar la demo. <br />
                • Moderación automática de comentarios (bloqueo de insultos).{' '}
                <br />
                • Perfil tipo bio con grid de fotos y score aproximado. <br />
                • Página de Score con bloques de reputación y logros.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 space-y-1">
                <p className="text-neutral-400">Pensado para</p>
                <p className="font-semibold text-neutral-100">
                  Inversores, parques científicos y convocatorias
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 space-y-1">
                <p className="text-neutral-400">Siguiente paso</p>
                <p className="font-semibold text-neutral-100">
                  Conectar IA real &amp; APIs externas (salud, ESG, etc.)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUE ES ETHIQIA */}
        <section className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              ¿Qué es Ethiqia?
            </h2>
            <p className="text-sm text-neutral-300">
              Ethiqia es una capa de reputación digital diseñada para un mundo
              donde las imágenes pueden ser generadas por IA, los comentarios
              pueden ser tóxicos y la visibilidad depende del ruido. En lugar
              de contar likes, Ethiqia mide autenticidad, conducta y
              contribución.
            </p>
            <p className="text-sm text-neutral-400">
              La demo actual muestra cómo se ve el producto: feed tipo
              Instagram, análisis básico de imágenes, moderación y un Ethiqia
              Score por bloques. Todo preparado para enseñar el concepto de
              forma visual.
            </p>
          </div>
          <div className="space-y-3 text-sm text-neutral-300">
            <h3 className="text-xs uppercase tracking-[0.22em] text-emerald-400">
              Tres ideas clave
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold text-neutral-100">
                  1 · Transparencia frente a IA
                </span>
                <p className="text-neutral-400 text-[13px]">
                  La IA no es el enemigo. El problema es no saber cuándo se
                  está usando. Ethiqia marca imágenes como Real / Mixta / Alta
                  prob. IA para aportar contexto, no castigo.
                </p>
              </li>
              <li>
                <span className="font-semibold text-neutral-100">
                  2 · Reputación por bloques, no un número mágico
                </span>
                <p className="text-neutral-400 text-[13px]">
                  El Ethiqia Score se compone de bloques: autenticidad,
                  conducta, comunidad, transparencia, sostenibilidad y
                  reconocimiento. Cada bloque se puede ver y entender.
                </p>
              </li>
              <li>
                <span className="font-semibold text-neutral-100">
                  3 · Ecosistema de señales externas
                </span>
                <p className="text-neutral-400 text-[13px]">
                  A futuro, Ethiqia podrá recibir señales de apps externas:
                  pasos diarios, acciones sostenibles, voluntariado, cursos
                  completados, certificaciones… y convertirlo en reputación
                  verificable.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* PARA PERSONAS Y EMPRESAS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-100">
              ¿Para quién es Ethiqia?
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
                Personas &amp; creadores
              </p>
              <p className="text-neutral-300">
                Personas que quieren cuidar su reputación digital, creadores que
                viven de su imagen pública y profesionales que necesitan un
                “CV reputacional” más allá de las típicas redes sociales.
              </p>
              <ul className="list-disc pl-4 text-[12px] text-neutral-400 space-y-1">
                <li>Visualizar su Ethiqia Score y bloques.</li>
                <li>Entender qué mejorar (conducta, autenticidad, impacto).</li>
                <li>Enseñar su score en procesos, colaboraciones o pitch.</li>
              </ul>
              <Link
                href="/profile"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ver ejemplo de bio →
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
                Empresas &amp; plataformas
              </p>
              <p className="text-neutral-300">
                Marketplaces, marcas, startups, instituciones o plataformas que
                necesitan una capa de confianza sobre personas, creadores o
                proyectos.
              </p>
              <ul className="list-disc pl-4 text-[12px] text-neutral-400 space-y-1">
                <li>Panel para evaluar reputación de perfiles clave.</li>
                <li>Verificación de campañas y contenido con IA.</li>
                <li>
                  Integración vía API del Ethiqia Score en sus propios
                  productos.
                </li>
              </ul>
              <Link
                href="/monetizar"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ver modelo de negocio →
              </Link>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA LA DEMO */}
        <section className="space-y-4 text-sm">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cómo funciona la demo que estás viendo
          </h2>
          <div className="grid gap-4 md:grid-cols-3 text-[12px]">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="text-neutral-400 font-semibold">1 · Feed</p>
              <p className="text-neutral-400">
                Página tipo Instagram donde se muestran publicaciones demo con
                análisis IA, likes, guardados y comentarios moderados.
              </p>
              <Link
                href="/feed"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ir al feed →
              </Link>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="text-neutral-400 font-semibold">2 · Subir imagen</p>
              <p className="text-neutral-400">
                En la parte de demo en vivo puedes subir una imagen para enseñar
                cómo se generaría un Ethiqia Score y cómo impacta en tu perfil
                y en el feed.
              </p>
              <span className="text-[11px] text-neutral-500">
                Ruta demo configurada localmente (según tu versión actual).
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 space-y-1">
              <p className="text-neutral-400 font-semibold">
                3 · Score por bloques
              </p>
              <p className="text-neutral-400">
                La página de Score resume tu reputación: score global, bloques
                con barras de rojo a verde, logros recientes y visión de
                integraciones API futuras.
              </p>
              <Link
                href="/score"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ver Score →
              </Link>
            </div>
          </div>
        </section>

        {/* SECCION FINAL PARA INVERSORES */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">
                Para inversores y parques científicos
              </p>
              <p className="text-sm font-semibold text-neutral-100">
                Ethiqia ya está lista para enseñarse como demo de producto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/news"
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-neutral-100 hover:border-emerald-400 hover:text-emerald-300"
              >
                Ver problemas que resolvemos
              </Link>
              <Link
                href="/monetizar"
                className="rounded-full bg-emerald-500 px-3 py-1.5 font-medium text-black hover:bg-emerald-400"
              >
                Ver cómo se monetiza
              </Link>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400">
            La demo actual no pretende ser un producto acabado, sino una prueba
            clara de concepto: interfaz, experiencia de usuario, bloques de
            score, narrativa de IA ética y un modelo de negocio escalable
            alrededor de la reputación digital y las APIs externas.
          </p>
        </section>
      </section>
    </main>
  );
}
