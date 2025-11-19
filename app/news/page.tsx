'use client';

import Link from 'next/link';

const updates = [
  {
    id: 1,
    title: 'Moderación avanzada con IA',
    date: '14 Nov 2025',
    content:
      'Hemos añadido un sistema de moderación automática que bloquea mensajes ofensivos y revisa en tiempo real los comentarios.',
  },
  {
    id: 2,
    title: 'Análisis IA de imágenes',
    date: '10 Nov 2025',
    content:
      'Nueva herramienta que detecta probabilidad de imagen generada por IA, manipulación digital y coherencia del perfil.',
  },
  {
    id: 3,
    title: 'Nuevos perfiles: personas y organizaciones',
    date: '5 Nov 2025',
    content:
      'Ahora puedes crear un perfil personal o uno de empresa y obtendrás un Ethiqia Score adaptado a tu tipo de actividad.',
  },
  {
    id: 4,
    title: 'Feed estilo Instagram',
    date: '2 Nov 2025',
    content:
      'Hemos lanzado el nuevo feed visual tipo Instagram, con verificación IA de imágenes, me gusta, comentarios y opciones de compartir.',
  },
];

export default function NewsPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50 px-4 py-8">
      <section className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Novedades de Ethiqia</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Últimas actualizaciones, mejoras del sistema y funciones nuevas.
          </p>
        </header>

        <div className="space-y-6">
          {updates.map((u) => (
            <article
              key={u.id}
              className="border border-neutral-800 bg-neutral-900/50 rounded-xl p-5"
            >
              <h2 className="text-xl font-semibold mb-1">{u.title}</h2>
              <p className="text-xs text-neutral-500 mb-3">{u.date}</p>
              <p className="text-sm text-neutral-300">{u.content}</p>
            </article>
          ))}
        </div>

        <footer className="text-center pt-6 border-t border-neutral-800">
          <Link
            href="/feed"
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            ← Volver al feed
          </Link>
        </footer>
      </section>
    </main>
  );
}
