import Link from 'next/link';

export default function DemoPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Demo · Ethiqia
        </p>
        <h1 className="text-3xl font-semibold">
          Demo interactiva de Ethiqia
        </h1>
        <p className="text-sm text-neutral-400">
          Esta demo muestra el concepto de Ethiqia como red social con IA: análisis de imágenes,
          reputación, moderación inteligente y protección a usuarios.
        </p>
      </header>

      {/* Bloque: Qué problema resuelve */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">¿Qué problema resuelve Ethiqia?</h2>
        <div className="grid gap-3 text-sm text-neutral-300">
          <p>
            Las redes sociales actuales (Instagram, TikTok, etc.) sufren:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-300">
            <li>Cierres de cuentas sin explicación clara.</li>
            <li>Bullying, acoso y comentarios tóxicos sin moderación real.</li>
            <li>Imágenes manipuladas o generadas por IA sin transparencia.</li>
            <li>Poca protección real para menores.</li>
            <li>Atención al usuario casi inexistente.</li>
          </ul>
          <p className="text-neutral-400 text-xs">
            Ethiqia nace para resolver esto con IA, transparencia y un sistema de reputación claro.
          </p>
        </div>
      </section>

      {/* Bloque: Qué hace la demo */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">¿Qué puedes ver en esta demo?</h2>
        <div className="grid gap-3 text-sm text-neutral-300">
          <ul className="list-disc list-inside space-y-1">
            <li>Feed visual tipo Instagram con perfiles simulados.</li>
            <li>Publicación demo generada desde tu propio perfil.</li>
            <li>
              <strong>Ethiqia Score</strong> visible en cada tarjeta, indicando nivel de confianza.
            </li>
            <li>
              Probabilidad de que la imagen sea generada por IA.
            </li>
            <li>
              Sistema de me gusta, guardar, compartir y doble tap.
            </li>
            <li>
              Comentarios con moderación automática por IA: insultos bloqueados y mensajes verificados.
            </li>
            <li>
              Modo seguro para ocultar contenido marcado como adulto.
            </li>
          </ul>
          <p className="text-xs text-neutral-500">
            Todo lo que se ve aquí es demo funcional: suficiente para entender el producto y su potencial
            de cara a inversores, Parque Científico o convocatorias públicas.
          </p>
        </div>
      </section>

      {/* Bloque: IA y reputación */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">IA, reputación y seguridad</h2>
        <p className="text-sm text-neutral-300">
          Ethiqia combina análisis de imagen, detección de contenido IA y reputación ética para ofrecer
          un entorno más seguro y fiable:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
          <li>Ethiqia Score basado en señales de comportamiento y contexto.</li>
          <li>Etiquetas de probabilidad IA en imágenes.</li>
          <li>Moderación automática de comentarios.</li>
          <li>Modo seguro para menores.</li>
        </ul>
      </section>

      {/* Botón principal: ver demo */}
      <section className="border border-neutral-800 rounded-xl bg-neutral-900/60 p-5 space-y-3">
        <h2 className="text-base font-semibold">
          Ver demo interactiva
        </h2>
        <p className="text-sm text-neutral-300">
          A continuación puedes acceder al feed demo de Ethiqia. Desde ahí podrás:
        </p>
        <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
          <li>Ver las tarjetas tipo Instagram.</li>
          <li>Probar los me gusta y los comentarios moderados por IA.</li>
          <li>Activar y desactivar el modo seguro.</li>
        </ul>

        <div className="pt-2">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
          >
            Ir al feed demo →
          </Link>
        </div>

        <p className="text-[11px] text-neutral-500 mt-2">
          Recomendado usar desde un navegador de escritorio o móvil moderno. Esta demo es una versión
          temprana pensada para mostrar el concepto a inversores y partners.
        </p>
      </section>
    </main>
  );
}
