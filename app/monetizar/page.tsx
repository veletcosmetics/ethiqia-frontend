export default function MonetizarPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="mx-auto max-w-4xl px-4 py-6 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            Modelo de negocio · Ethiqia
          </p>
          <h1 className="text-2xl font-semibold">
            Cómo se monetiza Ethiqia para personas, empresas y partners
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta sección resume de forma clara las vías de monetización de
            Ethiqia. Está pensada para inversores, parques científicos y
            potenciales partners que quieran entender cómo se convierte la capa
            de reputación en negocio: suscripciones, paneles profesionales,
            APIs y, en menor medida, formatos de visibilidad ética.
          </p>
        </header>

        {/* 1. Personas (usuarios individuales / creadores) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            1 · Monetización con personas (usuarios individuales y creadores)
          </h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-3">
            <p className="text-neutral-300">
              Para personas, Ethiqia se comporta como una capa de reputación
              encima de su actividad digital. La idea es ofrecer un producto
              fácil de entender, parecido a tener un “score de confianza” útil
              para su vida profesional, colaboraciones y presencia online.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300">
              <li>
                <span className="font-semibold">Ethiqia Premium (suscripción mensual):</span>{' '}
                acceso al detalle del Ethiqia Score, desglose por bloques
                (autenticidad, conducta, sostenibilidad, etc.), histórico,
                recomendaciones para mejorar y opciones avanzadas de privacidad.
              </li>
              <li>
                <span className="font-semibold">Modo Creator Pro:</span> panel
                específico para creadores de contenido, con analíticas sobre
                reputación, impacto de publicaciones y calidad percibida por la
                comunidad. Ideal para profesionales que viven de su imagen
                pública.
              </li>
              <li>
                <span className="font-semibold">Verificación avanzada:</span>{' '}
                paquetes de verificación puntual (por ejemplo, validación
                manual o semiautomática del perfil) que otorgan un sello extra
                de confianza. Se cobra como producto puntual o como add-on a la
                suscripción.
              </li>
            </ul>
            <p className="text-[11px] text-neutral-500">
              Filosofía clave: las personas pagan por entender su reputación,
              mejorarla y poder enseñarla como un activo (similar a un CV
              dinámico, pero basado en datos reales).
            </p>
          </div>
        </section>

        {/* 2. Empresas y organizaciones */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            2 · Monetización con empresas y organizaciones
          </h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-3">
            <p className="text-neutral-300">
              Para empresas, Ethiqia es una capa de confianza que se puede
              integrar en procesos, productos o comunidades: selección de
              talento, marketplaces, comunidades de creadores, plataformas de
              aprendizaje, etc.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300">
              <li>
                <span className="font-semibold">Licencias SaaS de panel empresarial:</span>{' '}
                acceso a un panel que permite ver el Ethiqia Score (o parte de
                él) de perfiles relevantes: creadores, proveedores, candidatos,
                etc. Modelo de suscripción mensual/anual según volumen.
              </li>
              <li>
                <span className="font-semibold">Verificación de campañas y contenido:</span>{' '}
                uso de Ethiqia para validar que el contenido asociado a la marca
                (campañas, colaboraciones, UGC) cumple unos mínimos de
                autenticidad y conducta. Ideal para departamentos de marketing,
                comunicación y reputación.
              </li>
              <li>
                <span className="font-semibold">Panel de riesgo reputacional:</span>{' '}
                score agregado para colectivos (por ejemplo, una comunidad de
                creadores o embajadores), ayudando a anticipar riesgos de
                imagen y tomar decisiones más informadas.
              </li>
            </ul>
            <p className="text-[11px] text-neutral-500">
              Filosofía clave: las empresas no compran datos sueltos, compran
              decisiones mejores. Ethiqia traduce señales complejas en un score
              accionable y explicable.
            </p>
          </div>
        </section>

        {/* 3. APIs (ecosistema de integraciones) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            3 · APIs y ecosistema de integraciones
          </h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-3">
            <p className="text-neutral-300">
              Una de las líneas más potentes de Ethiqia a medio plazo es
              convertirse en un estándar de reputación que pueda ser alimentado
              y consultado desde otras aplicaciones mediante APIs.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300">
              <li>
                <span className="font-semibold">API de consulta de Ethiqia Score:</span>{' '}
                otras plataformas pueden consultar (con permiso del usuario)
                parte del Ethiqia Score o bloques concretos (autenticidad,
                conducta, ESG, etc.) para tomar decisiones: acceso a ciertas
                funciones, visibilidad extra, verificación, etc.
              </li>
              <li>
                <span className="font-semibold">API de señales externas:</span>{' '}
                aplicaciones de salud, sostenibilidad, educación, voluntariado o
                certificaciones pueden enviar señales verificadas a Ethiqia:
                pasos diarios, acciones sostenibles, cursos completados,
                voluntariado registrado, credenciales profesionales, etc. Estas
                señales alimentan bloques específicos del score.
              </li>
              <li>
                <span className="font-semibold">Modelo win–win:</span> las apps
                externas pagan por integrar sus señales en Ethiqia (para que
                “cuenten” dentro de la reputación del usuario) y el usuario
                decide qué quiere conectar. Ethiqia actúa como capa neutra de
                reputación sobre múltiples servicios.
              </li>
            </ul>
            <p className="text-[11px] text-neutral-500">
              Esto abre una vía de ingresos B2B basada en consumo de API
              (requests) y en acuerdos con partners que quieran que sus datos
              formen parte del Ethiqia Score.
            </p>
          </div>
        </section>

        {/* 4. Publicidad y visibilidad ética */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            4 · Publicidad y formatos de visibilidad ética
          </h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs space-y-3">
            <p className="text-neutral-300">
              Aunque el modelo base de Ethiqia no se apoya en publicidad
              masiva, existe espacio para formatos de visibilidad muy cuidados,
              orientados a empresas o perfiles con buena reputación.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300">
              <li>
                <span className="font-semibold">Destacados por reputación:</span>{' '}
                espacios donde se destacan proyectos, empresas o creadores con
                un Ethiqia Score elevado o con logros concretos (impacto social,
                sostenibilidad, conducta ejemplar).
              </li>
              <li>
                <span className="font-semibold">Patrocinios alineados:</span>{' '}
                marcas que quieran asociarse a la idea de confianza, IA ética y
                reputación digital pueden patrocinar secciones concretas (por
                ejemplo, un bloque de sostenibilidad o un programa de logros).
              </li>
              <li>
                <span className="font-semibold">Sin formatos invasivos:</span>{' '}
                la idea no es llenar Ethiqia de anuncios, sino de destacar a
                quienes han demostrado buena reputación según métricas claras.
              </li>
            </ul>
          </div>
        </section>

        {/* Resumen para inversores */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Resumen para inversores y partners
          </h2>
          <p>
            Ethiqia combina varios modelos de ingreso: suscripciones para
            personas y creadores, licencias SaaS para empresas, uso de APIs
            (consulta de score y envío de señales externas) y formatos de
            visibilidad ética. Todo gira alrededor de la misma idea: una capa de
            reputación digital, ética y explicable que se puede integrar en
            múltiples contextos.
          </p>
          <p className="text-[11px] text-neutral-500">
            A medida que crece el ecosistema de integraciones, Ethiqia puede
            convertirse en un estándar de confianza: un score que no sólo mira
            lo que pasa dentro de una red social, sino también señales
            verificadas de salud, sostenibilidad, formación, impacto y conducta.
          </p>
        </section>
      </section>
    </main>
  );
}
