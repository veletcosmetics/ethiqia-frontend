'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '../../lib/session';

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

// Bio editable (solo en localStorage, modo demo)
type ProfileBio = {
  displayName: string;
  handle: string;
  bio: string;
};

const BIO_STORAGE_KEY = 'ethiqia_profile_bio';

const DEFAULT_BIO: ProfileBio = {
  displayName: 'Tu perfil Ethiqia',
  handle: '@ethiqia_demo',
  bio: 'Probando Ethiqia en modo demo: autenticidad, IA moderando y reputación digital medida con Ethiqia Score.',
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [demoPost, setDemoPost] = useState<DemoPost | null>(null);

  // Bio editable
  const [bio, setBio] = useState<ProfileBio>(DEFAULT_BIO);
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sesión básica desde localStorage
    const session = getSession();
    if (session?.user) {
      setHasSession(true);
      setUserName(session.user.name ?? null);
      setUserEmail(session.user.email ?? null);
    }

    // Última publicación de demo
    const raw = localStorage.getItem('ethiqia_demo_post');
    if (raw) {
      try {
        const data = JSON.parse(raw) as DemoPost;
        if (data.imageUrl) {
          setDemoPost(data);
        }
      } catch {
        // ignoramos errores de parse
      }
    }

    // Cargar bio desde localStorage, usando nombre de sesión como base
    try {
      const rawBio = localStorage.getItem(BIO_STORAGE_KEY);
      const baseBio: ProfileBio = {
        displayName: session?.user?.name ?? DEFAULT_BIO.displayName,
        handle: DEFAULT_BIO.handle,
        bio: DEFAULT_BIO.bio,
      };

      if (rawBio) {
        const stored = JSON.parse(rawBio) as ProfileBio;
        setBio({
          displayName: stored.displayName || baseBio.displayName,
          handle: stored.handle || baseBio.handle,
          bio: stored.bio || baseBio.bio,
        });
      } else {
        setBio(baseBio);
      }
    } catch {
      setBio({
        displayName: session?.user?.name ?? DEFAULT_BIO.displayName,
        handle: DEFAULT_BIO.handle,
        bio: DEFAULT_BIO.bio,
      });
    }

    setLoading(false);
  }, []);

  const handleBioChange = (field: keyof ProfileBio, value: string) => {
    setBio((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBio = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(bio));
    }
    setIsEditingBio(false);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando tu perfil…</p>
      </main>
    );
  }

  // Si no hay sesión, pedimos login
  if (!hasSession) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <section className="max-w-md w-full border border-neutral-800 rounded-xl bg-neutral-900/70 px-6 py-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Tu bio en Ethiqia</h1>
          <p className="text-sm text-neutral-400">
            Inicia sesión para ver tu perfil, tus datos básicos y tus últimas publicaciones.
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
            Esta sección será tu espacio personal: bio, foto, reputación y actividad en Ethiqia.
          </p>
        </section>
      </main>
    );
  }

  // Si hay sesión, mostramos perfil tipo Instagram
  const initials = (bio.displayName || userName || userEmail || 'T')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const publicationsCount = demoPost ? 1 : 0;
  const avgScore = demoPost?.score ?? 0;

  // Grid demo ampliada (visual) — primera celda real, resto celdas demo
  const gridSlots = 6;
  const gridArray = Array.from({ length: gridSlots }, (_, i) => i);

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <section className="max-w-3xl mx-auto space-y-8 px-4 py-6">
        {/* Cabecera tipo Instagram */}
        <header className="flex gap-6 items-center">
          <div className="h-24 w-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {demoPost?.imageUrl ? (
              <img
                src={demoPost.imageUrl}
                alt={bio.displayName || userName || 'Tu perfil'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold">
                  {bio.displayName || userName || 'Tu perfil Ethiqia'}
                </h1>
                <p className="text-xs text-neutral-400">
                  {bio.handle || '@ethiqia_demo'}
                </p>
                {userEmail && (
                  <p className="text-xs text-neutral-500 mt-1">{userEmail}</p>
                )}
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300 border border-emerald-500/40">
                ✓ Perfil demo verificado
              </span>

              <button
                type="button"
                onClick={() => {
                  if (isEditingBio) {
                    handleSaveBio();
                  } else {
                    setIsEditingBio(true);
                  }
                }}
                className="ml-auto text-[11px] rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
              >
                {isEditingBio ? 'Guardar bio' : 'Editar bio'}
              </button>
            </div>

            {/* Stats estilo Instagram mejoradas */}
            <div className="flex gap-4 text-sm text-neutral-300 mt-2">
              <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
                <p className="text-[11px] text-neutral-400">Publicaciones</p>
                <p className="text-lg font-semibold">
                  {publicationsCount}
                </p>
              </div>
              <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
                <p className="text-[11px] text-neutral-400">Ethiqia Score medio</p>
                <p className="text-lg font-semibold">
                  {avgScore ? `${avgScore}` : '—'}
                </p>
              </div>
              <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
                <p className="text-[11px] text-neutral-400">Modo demo</p>
                <p className="text-[12px] text-neutral-300">
                  Datos locales
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Bio / texto explicativo + edición */}
        <section className="space-y-3 border border-neutral-800 rounded-2xl bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-neutral-200">Sobre tu espacio</h2>

          {isEditingBio ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Nombre visible
                </label>
                <input
                  value={bio.displayName}
                  onChange={(e) => handleBioChange('displayName', e.target.value)}
                  className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Usuario / handle
                </label>
                <input
                  value={bio.handle}
                  onChange={(e) => handleBioChange('handle', e.target.value)}
                  className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio.bio}
                  onChange={(e) => handleBioChange('bio', e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-emerald-400 resize-none"
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                Esta bio se guarda solo en tu navegador (modo demo). No se envía a ningún servidor.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                {bio.bio}
              </p>
              <p className="text-xs text-neutral-500">
                En la versión completa, aquí verás tu biografía, foto de perfil, enlaces y métricas de reputación.
              </p>
            </>
          )}
        </section>

        {/* Tus publicaciones: botón + cuadrícula + destacada */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-neutral-200">Tus publicaciones</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(
                    'En la demo, la publicación se genera subiendo una imagen y se muestra en el feed y en tu perfil. En la versión completa, este botón abrirá el flujo de “Añadir publicación”.'
                  );
                }}
                className="text-[11px] rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-200 hover:border-emerald-400 hover:text-emerald-300"
              >
                + Añadir publicación demo
              </button>
              <Link
                href="/feed"
                className="text-[11px] text-emerald-300 hover:text-emerald-200"
              >
                Ver en el feed →
              </Link>
            </div>
          </div>

          {/* Cuadrícula tipo Instagram (ampliada, modo demo) */}
          <div className="grid grid-cols-3 gap-[2px] bg-neutral-900 rounded-lg overflow-hidden">
            {gridArray.map((slot) => {
              if (slot === 0 && demoPost) {
                // Primera celda: tu publicación real de demo
                return (
                  <div key={slot} className="relative w-full aspect-square">
                    <img
                      src={demoPost.imageUrl}
                      alt="Tu publicación"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent px-2 pb-1 text-[10px] text-neutral-100 opacity-0 hover:opacity-100 transition-opacity">
                      <span>Ethiqia Score: {demoPost.score}/100</span>
                      <span>Demo</span>
                    </div>
                  </div>
                );
              }

              // Celdas demo / placeholder
              return (
                <div
                  key={slot}
                  className="relative w-full aspect-square bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-500"
                >
                  <span className="opacity-70">
                    Slot demo
                  </span>
                </div>
              );
            })}
          </div>

          {/* Publicación destacada debajo (más “bonita”) */}
          {demoPost ? (
            <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-gradient-to-b from-neutral-900 to-black mt-4">
              <div className="relative w-full bg-neutral-800 aspect-[4/5]">
                <img
                  src={demoPost.imageUrl}
                  alt="Tu última publicación"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="text-[11px] rounded-full bg-black/70 px-2 py-[3px] text-neutral-100 border border-neutral-700">
                    Publicación destacada
                  </span>
                  <span className="text-[11px] rounded-full bg-emerald-500/80 px-2 py-[3px] text-black font-semibold">
                    Score {demoPost.score}/100
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8 text-[11px] text-neutral-200">
                  <p className="font-medium">
                    Demo de cómo Ethiqia puntúa tu contenido.
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1 text-sm">
                <p className="text-neutral-200 font-medium">
                  Última publicación de demo
                </p>
                <p className="text-[13px] text-neutral-400">
                  Esta foto se genera en el flujo de demo para enseñar Ethiqia a inversores, Parque Científico y convocatorias públicas.
                </p>
                <p className="text-[12px] text-neutral-300">
                  <span className="font-semibold">Ethiqia Score:</span>{' '}
                  {demoPost.score}/100
                </p>
                <p className="text-[11px] text-neutral-500">
                  En la versión completa, aquí verías likes, comentarios y el detalle de cómo la IA ha calculado tu reputación.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-3">
              Aún no tienes publicaciones. Sube una imagen desde el flujo de demo y se mostrará aquí.
            </p>
          )}
        </section>

        <p className="text-center text-[11px] text-neutral-500">
          Perfil demo de Ethiqia: experiencia similar a Instagram, pero con IA revisando autenticidad y reputación digital en segundo plano.
        </p>
      </section>
    </main>
  );
}
