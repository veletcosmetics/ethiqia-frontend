"use client";

import React from "react";

export default function NormasPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Título */}
        <header className="space-y-3">
          <h1 className="text-4xl font-bold">Normas de la Comunidad Ethiqia</h1>
          <p className="text-lg text-gray-300">
            Contenido auténtico, respetuoso y verificable.
          </p>
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

        {/* Contenido NO permitido */}
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

        {/* Protección de datos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Protección de datos</h2>
          <p className="text-gray-300 leading-relaxed">
            No vendemos tus datos ni tus imágenes. El análisis de IA se usa
            exclusivamente para mejorar la seguridad y la reputación dentro de Ethiqia.
            Puedes solicitar la eliminación de tu cuenta y de todos tus datos en
            cualquier momento.
          </p>
        </section>

        {/* Actualizaciones */}
        <section className="space-y-4 pb-20">
          <h2 className="text-2xl font-semibold">Actualización de estas normas</h2>
          <p className="text-gray-300 leading-relaxed">
            Ethiqia es un proyecto en evolución. Estas normas pueden actualizarse a
            medida que crecemos o cambian las leyes. Siempre informaremos de los cambios
            importantes de forma clara.
          </p>
        </section>
      </div>
    </div>
  );
}
