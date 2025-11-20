'use client';

type ProblemSolution = {
  id: string;
  title: string;
  problem: string;
  solution: string;
};

const BLOCKS: ProblemSolution[] = [
  {
    id: 'ia-vs-real',
    title: 'Autenticidad de imágenes (IA vs real)',
    problem:
      'Las plataformas actuales no diferencian bien entre fotografías reales y contenido generado por IA. Esto abre la puerta a desinformación visual, deepfakes creíbles, publicidad engañosa y pérdida de confianza.',
    solution:
      'Ethiqia no penaliza el uso de IA: lo etiqueta y lo contextualiza. Usamos un enfoque híbrido (señales forenses, modelos de detección, metadatos y estándares como C2PA) para estimar la probabilidad de que una imagen sea IA y mostrar badges del tipo “Real / Mixta / Alta prob. IA”. La transparencia es el valor central.',
  },
  {
    id: 'reputation',
    title: 'Reputación digital real (más allá de likes)',
    problem:
      'Las redes actuales miden popularidad: likes, seguidores, viralidad. Pero no miden autenticidad, coherencia, impacto positivo ni comportamiento ético. Es difícil saber en quién confiar.',
    solution:
      'Ethiqia introduce el Ethiqia Score (0–100), un score de reputación digital explicable. Se compone de varios bloques: autenticidad visual, conducta, contribución comunitaria, transparencia, sostenibilidad e impacto, y reconocimiento externo. No mide ruido, mide fiabilidad.',
  },
  {
    id: 'moderation',
    title: 'Moderación lenta, desigual y poco clara',
    problem:
      'La moderación tradicional es manual, lenta y a menudo arbitraria. Comentarios tóxicos se quedan días, mientras otros se bloquean sin explicación. Esto genera frustración y desconfianza hacia la plataforma.',
    solution:
      'Ethiqia aplica moderación automática con IA en tiempo casi real: detecta insultos básicos y lenguaje tóxico, bloquea el comentario y muestra un mensaje claro al usuario. La conducta digital influye en el Ethiqia Score, incentivando un comportamiento más responsable sin recurrir a “bans” opacos.',
  },
  {
    id: 'transparency',
    title: 'Falta de transparencia y trazabilidad',
    problem:
      'Hoy es fácil borrar publicaciones, reescribir la narrativa y limpiar el propio pasado digital. No existe trazabilidad clara de qué se publicó, cuándo y en qué contexto, lo que dificulta confiar en perfiles, marcas o proyectos.',
    solution:
      'Ethiqia genera una huella técnica por publicación (hash simulado en la demo) y construye una trayectoria reputacional. En un entorno real, estos identificadores podrían integrarse con infraestructuras de confianza o estándares como Content Credentials, permitiendo auditar cambios y mantener coherencia en el tiempo.',
  },
  {
    id: 'greenwashing',
    title: 'Greenwashing y sostenibilidad no verificable',
    problem:
      'Muchas personas y empresas declaran ser “sostenibles” o tener impacto social, pero sin evidencias claras. El greenwashing se mezcla con proyectos serios y es difícil distinguir marketing de impacto real.',
    solution:
      'Ethiqia propone un modelo por niveles de evidencia: desde simples declaraciones hasta pruebas adjuntas y validaciones de terceros. En fases avanzadas, integrará APIs externas (apps de huella de carbono, donaciones, proyectos ESG, certificaciones) para convertir acciones reales en señales verificadas dentro del bloque de Sostenibilidad e Impacto del Ethiqia Score.',
  },
  {
    id: 'community',
    title: 'Contribución comunitaria invisible',
    problem:
      'En la mayoría de redes, el valor recae en quien genera más ruido, no en quien aporta más valor. Los perfiles constructivos quedan ocultos frente a cuentas tóxicas o puramente virales.',
    solution:
      'Ethiqia da peso específico a la contribución comunitaria: contenido útil, ayuda a otras personas, participación activa y comportamiento constructivo. Este bloque alimenta directamente el Ethiqia Score, de forma que ser útil a la comunidad se ve recompensado.',
  },
  {
    id: 'trajectory',
    title: 'Trayectoria, logros y señales externas',
    problem:
      'Las plataformas actuales no convierten la constancia, los buenos hábitos o los logros reales en una trayectoria reconocible. Tampoco integran señales externas (salud, sostenibilidad, formación, voluntariado) en la reputación digital.',
    solution:
      'Ethiqia plantea un sistema de logros e hitos reputacionales (“30 días sin comentarios tóxicos”, “10 publicaciones analizadas”, etc.) y, a futuro, integraciones vía API con aplicaciones externas: pasos diarios verificados, acciones sostenibles, cursos completados, credenciales profesionales o voluntariado certificado. Estas señales alimentarán los bloques de reputación relevantes y reforzarán la trayectoria del usuario.',
  },
  {
    id: 'conduct',
    title: 'Conducta digital sin memoria',
    problem:
      'El hate, el spam y la polarización se olvidan rápido: o no se registran, o acaban en un ban genérico sin contexto. No hay una memoria fina del comportamiento digital.',
    solution:
      'En Ethiqia, la conducta digital es una dimensión explícita del score. Comentarios respetuosos y participaciones constructivas suman; el lenguaje tóxico recurrente resta. No se trata de censura, sino de medir y mostrar el impacto de las conductas sobre la reputación a largo plazo.',
  },
];

export default function NewsPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            Novedades · Ethiqia
          </p>
          <h1 className="text-2xl font-semibold">
            Problemas del mundo digital y cómo Ethiqia los está abordando
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta sección resume, en formato problema → solución, los bloques
            principales que Ethiqia quiere resolver: autenticidad de imágenes,
            reputación digital, moderación, transparencia, sostenibilidad,
            contribución comunitaria, trayectoria y conducta. Es una vista
            pensada para inversores, partners y equipos técnicos.
          </p>
        </header>

        {/* Bloques problema → solución */}
        <section className="space-y-4">
          {BLOCKS.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3"
            >
              <h2 className="text-sm font-semibold text-neutral-100">
                {item.title}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-red-400">
                    Problema
                  </p>
                  <p className="text-neutral-300">{item.problem}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">
                    Solución Ethiqia
                  </p>
                  <p className="text-neutral-300">{item.solution}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Bloque sobre score por bloques */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 text-xs text-neutral-300">
          <h2 className="text-sm font-semibold text-neutral-100">
            Ethiqia Score por bloques: de la teoría a la demo
          </h2>
          <p>
            En la demo actual de Ethiqia, el score global y los bloques de
            reputación se calculan de forma simulada a partir de tus
            publicaciones. La lógica que ves en{' '}
            <code className="bg-neutral-950 px-1 py-[1px] rounded text-[10px]">
              /score
            </code>{' '}
            y en el feed ilustra cómo podrían funcionar en producción los
            conceptos explicados en esta página.
          </p>
          <p className="text-[11px] text-neutral-500">
            La visión a medio plazo es clara: un score ético, explicable y
            compuesto por bloques (autenticidad, conducta, comunidad,
            transparencia, sostenibilidad, reconocimiento) que se alimenta de
            acciones en la propia plataforma y, opcionalmente, de señales
            verificadas vía API desde otras aplicaciones (health, ESG,
            formación, certificaciones…).
          </p>
        </section>

        {/* Roadmap breve */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Roadmap conceptual (demo → producto)
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <span className="font-semibold">Fase demo:</span> feed tipo
              Instagram, análisis IA simulado por imagen, Ethiqia Score básico y
              moderación de comentarios sencilla.
            </li>
            <li>
              <span className="font-semibold">Fase producto inicial:</span>{' '}
              afinado de detección IA híbrida, definición formal de bloques y
              panel de reputación para personas y organizaciones.
            </li>
            <li>
              <span className="font-semibold">Fase ecosistema:</span>{' '}
              integraciones vía API con aplicaciones de salud, sostenibilidad,
              educación, voluntariado o certificaciones, que alimentan bloques
              concretos del Ethiqia Score y convierten acciones reales en
              reputación digital verificable.
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
