'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

type ProfilePost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

type SessionData = {
  user?: {
    email?: string;
    name?: string;
  };
};

export default function ProfilePage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Cargar sesión local (demo)
    const s = getSession();
    setSession(s as SessionData | null);

    // 2) Cargar publicaciones reales desde Supabase
    const loadPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando posts para el perfil:', error);
        setPosts([]);
      } else {
        setPosts(data as ProfilePost[]);
      }

      setLoading(false);
    };

    loadPosts();
  }, []);

  const email = session?.user?.email || 'demo-user@ethiqia.app';
  const name = session?.user?.name || 'Demo Ethiqia';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Cabecera del perfil */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar simple con iniciales */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-black">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{name}</h1>
              <p className="text-xs text-neutral-400">{email}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                ● Perfil demo conectado a backend (Supabase)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right text-[11px] text-neutral-400">
            <button
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-emerald-400"
              type="button"
            >
              ✏️ Editar perfil (demo)
            </button>
            <p>
              Publicaciones reales guardadas:{' '}
              <span className="font-semibold text-emerald-400">
                {posts.length}
              </span>
            </p>
          </div>
        </header>

        {/* Bloques de estado */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-xs space-y-1">
            <p className="text-neutral-400 text-[11px] uppercase tracking-wide">
              Publicaciones
            </p>
            <p className="text-2xl font-semibold text-emerald-400">
              {posts.length}
            </p>
            <p className="text-[11px] text-neutral-500">
              Imágenes subidas desde la demo y guardadas en la base de datos
              real.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-xs space-y-1">
            <p className="text-neutral-400 text-[11px] uppercase tracking-wide">
              Estado
            </p>
            <p className="text-sm font-semibold text-neutral-100">
              Demo lista para enseñar a inversores
            </p>
            <p className="text-[11px] text-neutral-500">
              Login, bio conectada a backend y feed leyendo de la tabla{' '}
              <code>posts</code>.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-xs space-y-1">
            <p className="text-neutral-400 text-[11px] uppercase tracking-wide">
              Siguiente fase
            </p>
            <p className="text-sm font-semibold text-neutral-100">
              Conectar panel empresa y APIs externas
            </p>
            <p className="text-[11px] text-neutral-500">
              Más bloques de score, reputación y casos de uso B2B.
            </p>
          </div>
        </section>

        {/* Bio */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-sm space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">Tu bio</h2>
          <p className="text-neutral-300 text-sm">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad.
          </p>
          <p className="text-[11px] text-neutral-500">
            En esta versión alfa, tus imágenes se guardan en Supabase en la
            tabla <code>posts</code> como si fueran publicaciones reales. Más
            adelante, cada perfil tendrá un histórico de Ethiqia Score,
            verificaciones y logros.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">
              Tus publicaciones reales
            </h2>
            <a
              href="/feed"
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Ver en el feed →
            </a>
          </div>

          {loading && (
            <p className="text-xs text-neutral-500">
              Cargando tus publicaciones…
            </p>
          )}

          {!loading && posts.length === 0 && (
            <p className="text-xs text-neutral-500">
              Todavía no has subido ninguna foto desde la demo en vivo. Ve a{' '}
              <a href="/demo/live" className="text-emerald-400 underline">
                Demo &gt; Live
              </a>{' '}
              y sube tu primera imagen.
            </p>
          )}

          {!loading && posts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
                >
                  <div className="bg-black">
                    <img
                      src={post.image_url}
                      alt={post.caption || 'Publicación en Ethiqia'}
                      className="w-full max-h-64 object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] text-neutral-400 truncate">
                      {post.caption || 'Imagen subida desde la demo en vivo'}
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Ethiqia Score: 72/100 (simulado)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
