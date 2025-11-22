'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [demoPost, setDemoPost] = useState<DemoPost | null>(null);

  // Cargar usuario real de Supabase + última publicación demo
  useEffect(() => {
    let isMounted = true;

    async function load() {
      // 1) Usuario de Supabase
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !data?.user) {
        // No logueado → mostramos pantalla de “no sesión”
        setLoading(false);
        return;
      }

      const user = data.user;
      setUserEmail(user.email ?? null);
      const metaName =
        (user.user_metadata && (user.user_metadata.name as string)) || null;
      setUserName(metaName);

      // 2) Última publicación demo guardada en el navegador
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('ethiqia_demo_post');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as DemoPost;
            if (parsed.imageUrl) setDemoPost(parsed);
          } catch {
            // ignoramos errores de parseo
          }
        }
      }

      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Estado de carga
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando tu perfil…</p>
      </main>
    );
  }

  // Si no hay usuario autenticado
  if (!userEmail) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <section className="max-w-md w-full border border-neutral-800 rounded-xl bg-neutral-900/70 px-6 py-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Tu bio en Ethiqia</h1>
          <p className="text-sm text-neutral-400">
            No has iniciado sesión. Entra con tu cuenta para ver tu bio,
            reputación y publicaciones.
          </p>
          <div className="flex justify-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-neutral-700 px-4 py-2 font-medium text-neutral-100 hover:border-neutral-500"
            >
              Crear cuenta
            </Link>
          </div>
          <p className="text-[11px] text-neutral-500">
            Este espacio se vincula a tu usuario real de Supabase: email,
            reputación y actividad en el feed.
          </p>
        </section>
      </main>
    );
  }

  // Datos visuales de perfil
  const displayName =
    userName ||
    (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail) ||
    'Tu perfil Ethiqia';

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const publicationsCount = demoPost ? 1 : 0;
  const avgScore = demoPost?.score ?? 0;

  // Imágenes de relleno para que la cuadrícula se vea “llena”
  const placeholderImages = [
    '/demo/profile-stock.jpg',
    '/demo/profile-stock.jpg',
    '/demo/profile-stock.jpg',
    '/demo/profile-stock.jpg',
    '/demo/profile-stock.jpg',
    '/demo/profile-stock.jpg',
  ];

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Cabecera tipo Instagram */}
        <header className="flex gap-6 items-center">
          <div className="h-24 w-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {demoPost?.imageUrl ? (
              <img
                src={demoPost.imageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold">{displayName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300 border border-emerald-500/40">
                ✓ Perfil demo conectado a Supabase
              </span>
            </div>
            <p className="text-sm text-neutral-400">{userEmail}</p>

            <div className="flex gap-6 text-sm text-neutral-300 mt-2">
              <div>
                <span className="font-semibold">{publicationsCount}</span>{' '}
                publicaciones
              </div>
              <div>
                <span className="font-semibold">
                  {avgScore ? `${avgScore}` : '—'}
                </span>{' '}
                Ethiqia Score medio
              </div>
            </div>
          </div>
        </header>

        {/* Bio / explicación */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-200">Tu bio</h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus
            fotos publicadas y la reputación asociada a tu actividad. Ya estás
            conectado a un usuario real de Supabase, así que este perfil es la
            base para la versión productiva.
          </p>
          <p className="text-xs text-neutral-500">
            En la versión completa podrás editar tu biografía, cambiar tu foto
            de perfil, añadir enlaces y consultar historiales de Ethiqia Score,
            verificaciones y logros.
          </p>
        </section>

        {/* Tus publicaciones */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-neutral-200">
              Tus publicaciones
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href="/demo/live"
                className="text-[11px] rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
              >
                + Subir foto en demo live
              </Link>
              <Link
                href="/feed"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ver en el feed →
              </Link>
            </div>
          </div>

          {/* Cuadrícula tipo Instagram */}
          <div className="grid grid-cols-3 gap-[2px] bg-neutral-900 rounded-lg overflow-hidden">
            {demoPost ? (
              <>
                <img
                  src={demoPost.imageUrl}
                  alt="Tu publicación"
                  className="w-full aspect-square object-cover"
                />
                {placeholderImages.slice(0, 5).map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Placeholder ${idx + 1}`}
                    className="w-full aspect-square object-cover opacity-60"
                  />
                ))}
              </>
            ) : (
              placeholderImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Placeholder ${idx + 1}`}
                  className="w-full aspect-square object-cover opacity-40"
                />
              ))
            )}
          </div>

          {/* Publicación destacada */}
          {demoPost ? (
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60 mt-4">
              <div className="w-full bg-neutral-800 aspect-[4/5]">
                <img
                  src={demoPost.imageUrl}
                  alt="Tu última publicación"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-4 py-3 space-y-1 text-sm">
                <p className="text-neutral-200 font-medium">
                  Última publicación analizada
                </p>
                <p className="text-[13px] text-neutral-400">
                  Esta imagen se ha subido desde la demo en vivo para enseñar a
                  inversores, Parque Científico y empresas cómo Ethiqia analiza
                  contenido y genera reputación.
                </p>
                <p className="text-[12px] text-neutral-300">
                  <span className="font-semibold">Ethiqia Score:</span>{' '}
                  {demoPost.score}/100
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-3">
              Aún no tienes publicaciones analizadas. Sube una imagen desde la
              demo en vivo y se mostrará aquí.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
