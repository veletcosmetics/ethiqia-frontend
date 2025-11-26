'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import NotificationsBar from '../../components/demo/NotificationsBar';
import { DemoPost, loadDemoPosts } from '../../lib/demoStorage';

export default function FeedPage() {
  const [posts, setPosts] = useState<DemoPost[]>([]);

  useEffect(() => {
    setPosts(loadDemoPosts());
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <NotificationsBar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Feed (demo local)</h1>
            <p className="text-sm text-slate-400">
              Publicaciones generadas desde la demo de Ethiqia en este navegador.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {posts.length} publicaciones locales
          </div>
        </header>

        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">
            Todavía no hay publicaciones. Ve a{' '}
            <span className="text-emerald-300">/demo/live</span> para subir tu primera imagen.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={post.imageUrl}
                    alt="Publicación Ethiqia"
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                  <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    {post.score}/100
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-400">
                  <span>Demo reputación · IA</span>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
