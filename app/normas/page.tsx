"use client";

import React from "react";
import Link from "next/link";

export default function NormasPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Título + selector de idioma */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">Normas de la Comunidad Ethiqia</h1>
            <p className="text-lg text-gray-300">
              Contenido auténtico, respetuoso y verificable.
            </p>
          </div>

          {/* Selector de idioma (placeholder) */}
          <div className="inline-flex items-center rounded-full bg-zinc-900/80 border border-zinc-700 px-1 py-1 text-xs">
            <button className="px-3 py-1 rounded-full bg-white text-black text-xs font-medium">
              ES
            </button>
            <button
              className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 cursor-not-allowed"
              title="English version coming soon"
            >
              EN
            </button>
          </div>
        </header>

        {/* ¿Qué es Ethiqia? */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">¿Qué es Ethiqia?</h2>
          <p className="text-gray-300 leading-relaxed">
            Ethiqia es una plataforma diseñada para mostrar contenido auténtico y
            construir reputación real tanto de personas como de empresas. Nuestro
            objetivo es que lo que ves en Ethiqia se parezca lo máximo posible a
            la realidad: sin engaños, sin odio y sin manipulación digital.
          </p>
        </section>

        {/* Principios básicos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Principios básicos</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>
              <strong>Autenticidad:</strong> No aceptamos deepfakes, falsificaciones,
              suplantaciones ni manipulaciones engañosas.
            </li>
            <li>
              <strong>Respeto:</strong> No permitimos ataques personales, bullying,
              acoso ni discurso de odio.
            </li>
            <li>
              <strong>Seguridad:</strong> Bloqueamos contenido que promueva violencia,
              autolesiones o ponga en riesgo a menores.
            </li>
            <li>
              <strong>Transparencia:</strong> Informamos claramente cuando un contenido
              no puede publicarse por incumplir normas.
            </li>
          </ul>
        </section>

        {/* Contenido no permitido */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contenido no permitido</h2>
          <p className="text-gray-300">
            Para mantener un espacio seguro y confiable, bloqueamos o limitamos estos
            tipos de contenido:
          </p>

          <ul className="list-disc pl-6 space-y-3 text-gray-300">
            <li>
              <strong>Discurso de odio:</strong> contenido que ataque o deshumanice
              a personas por raza, religión, etnia, género, orientación sexual u
              otras características protegidas.
            </li>

            <li>
              <strong>Acoso, bullying y amenazas:</strong> insultos graves, campañas de
              humillación, persecución, manipulación emocional, intimidación o amenazas
              de daño físico o reputacional.
            </li>

            <li>
              <strong>Violencia extrema o criminalidad:</strong> promoción de actos
              violentos, terrorismo, crimen organizado o comportamiento ilegal.
            </li>

            <li>
              <strong>Autolesiones y suicidio:</strong> contenido que anime, glorifique
              o trivialice el daño hacia uno mismo o hacia otros.
            </li>

            <li>
              <strong>Contenido sexual con menores:</strong> prohibido sin excepción.
            </li>

            <li>
              <strong>Suplantación de identidad y fraude:</strong> perfiles falsos,
              certificados inventados, reseñas manipuladas y “antes/después”
              deliberadamente engañosos.
            </li>
          </ul>
        </section>

        {/* IA Moderación */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            ¿Cómo funciona la moderación por IA?
          </h2>

          <p className="text-gray-300 leading-relaxed">
            Ethiqia utiliza modelos de inteligencia artificial para analizar tus
            publicaciones antes de que se hagan públicas. La IA evalúa el texto y, en
            futuras versiones, también las imágenes.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Detecta contenido de odio, violencia o sexual inapropiado.</li>
            <li>Marca publicaciones como seguras, sensibles o no permitidas.</li>
            <li>
              Bloquea automáticamente casos graves (odio extremo, menores, autolesiones).
            </li>
            <li>
              Ajustamos las reglas de forma continua para mantener la justicia y la
              coherencia.
            </li>
          </ul>

          <p className="text-gray-300 leading-relaxed">
            Si la IA detecta algo dudoso, puedes editar el texto antes de publicar.
            En casos graves, la publicación será rechazada automáticamente.
          </p>
        </section>

        {/* Contenido sensible */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contenido sensible pero permitido</h2>
          <p className="text-gray-300 leading-relaxed">
            Algunos temas son delicados (salud mental, experiencias difíciles,
            conflictos, etc.) pero están permitidos si se expresan con respeto y sin
            incitar al odio o al daño. En algunos casos, podemos mostrar avisos de
            “contenido sensible”.
          </p>
        </section>

        {/* Ethiqia Score y manipulación */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Ethiqia Score y manipulación de reputación</h2>
          <p className="text-gray-300 leading-relaxed">
            El Ethiqia Score refleja tu reputación dentro de la plataforma y se alimenta
            de tu actividad real, tus colaboraciones y datos verificables. No está
            pensado para ser un número inflado artificialmente, sino una señal de
            confianza.
          </p>
          <p className="text-gray-300 leading-relaxed">
            No está permitido crear múltiples cuentas para beneficiarse, intercambiar
            puntuaciones (“tú me subes, yo te subo”), pagar por reseñas encubiertas o
            modificar documentos para simular logros o certificaciones inexistentes.
            Cuando detectemos actividad fraudulenta, podremos corregir el score,
            limitar funcionalidades o suspender cuentas.
          </p>
        </section>

        {/* Protección de datos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Protección de datos</h2>
          <p className="text-gray-300 leading-relaxed">
            No vendemos tus datos ni tus imágenes. El análisis de IA se usa
            exclusivamente para mejorar la seguridad y la reputación dentro de Ethiqia.
            Evita publicar datos personales de terceros (teléfonos, direcciones,
            documentos, historiales médicos, etc.) sin su permiso explícito.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Puedes solicitar la eliminación de tu cuenta y de tus datos en cualquier
            momento siguiendo el procedimiento que indicaremos en el apartado de
            privacidad.
          </p>
        </section>

        {/* Reportar contenido */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Botón “Reportar contenido”</h2>
          <p className="text-gray-300 leading-relaxed">
            Si ves un contenido que crees que vulnera estas normas o la legislación,
            puedes usar el botón <strong>“Reportar contenido”</strong>. Eso nos ayuda a
            actuar rápido ante:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Abuso, acoso o discurso de odio.</li>
            <li>Contenido que pueda dañar a menores.</li>
            <li>Fraudes, estafas o suplantaciones de identidad.</li>
            <li>Publicación de datos personales o información confidencial.</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            Reportar no es una herramienta para censurar opiniones con las que no
            estás de acuerdo, sino un mecanismo para proteger a la comunidad.
          </p>
        </section>

        {/* Solicitar revisión manual */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Botón “Solicitar revisión manual”</h2>
          <p className="text-gray-300 leading-relaxed">
            Si crees que hemos cometido un error (por ejemplo, se ha bloqueado una
            publicación que sí cumple las normas o tu cuenta ha sido limitada de forma
            injusta), podrás usar el botón{" "}
            <strong>“Solicitar revisión manual”</strong>.
          </p>
          <p className="text-gray-300 leading-relaxed">
            En esa solicitud podrás explicar el contexto, aportar enlaces o documentos
            y, si aplica, indicarnos cómo afecta esto a tu reputación o a tu actividad
            profesional. Daremos prioridad a los casos más graves o con mayor impacto.
          </p>
        </section>

        {/* CTA con botones */}
        <section className="space-y-4 pb-10">
          <h2 className="text-2xl font-semibold">
            ¿Necesitas informar de algo o revisar una decisión?
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Si ya estás usando Ethiqia y quieres actuar sobre un contenido concreto o
            una decisión de moderación, podrás hacerlo desde los siguientes accesos:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/reportar"
              className="flex items-center justify-center rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 transition"
            >
              Reportar contenido
            </Link>

            <Link
              href="/revision-manual"
              className="flex items-center justify-center rounded-xl border border-blue-500/60 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition"
            >
              Solicitar revisión manual
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Si estos enlaces todavía no están activos en tu versión de la app, se
            habilitarán cuando el sistema de reportes y revisiones esté disponible en
            producción.
          </p>
        </section>

        {/* Actualizaciones */}
        <section className="space-y-4 pb-20 border-t border-zinc-800 pt-8">
          <h2 className="text-2xl font-semibold">Actualización de estas normas</h2>
          <p className="text-gray-300 leading-relaxed">
            Ethiqia es un proyecto en evolución. Estas normas pueden actualizarse a
            medida que crecemos o cambian las leyes. Cuando haya cambios importantes
            lo comunicaremos de forma clara dentro de la propia plataforma.
          </p>
        </section>
      </div>
    </div>
  );
}
