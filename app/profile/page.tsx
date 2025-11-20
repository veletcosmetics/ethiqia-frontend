'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '../../lib/session';
import { getUnreadCount } from '../../lib/notifications';

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

const DEMO_IMAGE = '/demo/profile-stock.jpg';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [demoPost, setDemoPost] = useState<DemoPost | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

    // Notificaciones no leídas
    try {
      const count = getUnreadCount();
      setUnreadNotifications(count);
    } catch {
      setUnreadNotifications(0);
    }

    setLoading(false);
  }, []);

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
  const initials = (userName ?? userEmail ?? 'T')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const publicationsCount = demoPost ? 1 : 0;
  const avgScore = demoPost?.score ?? 0;

  const gridImages = demoPost
    ? [demoPost.imageUrl, DEMO_IMAGE, DEMO_IMAGE]
    : [DEMO_IMAGE, DEMO_IMAGE, DEMO_IMAGE];

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <section className="max-w-3xl mx-auto space-y-8 px-4 py-6">
        {/* BANDA DE NOTIFICACIONES ARRIBA */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-2 text-xs text-neutral-200">
          <div className="flex flex-col">
            <span className="font-medium">
              Panel de actividad de Ethiqia
            </span>
            {unreadNotifications > 0 ? (
              <span className="text-[11px] text-emerald-300">
                Tienes {unreadNotifications} notificacion
                {unreadNotifications > 1 ? 'es' : ''} pendiente
                {unreadNotifications > 1 ? 's' : ''} de la IA.
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400">
                Todo al día. No hay notificaciones pendientes.
              </span>
            )}
          </div>

          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 text-[11px] text-neutral-100 hover:border-emerald-400 hover:text-emerald-300"
          >
            <span>🔔</span>
            <span>Ver notificaciones</span>
          </Link>
        </div>

        {/* Cabecera tipo Instagram */}
        <header className="flex gap-6 items-center">
          <div className="h-24 w-24 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {demoPost?.imageUrl ? (
              <img
                src={demoPost.imageUrl}
                alt={userName ?? 'Tu perfil'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold">
                {userName || 'Tu perfil Ethiqia'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-[3px] text-[11px] text-emerald-300 border border-emerald-500/40">
                ✓ Perfil demo verificado
              </span>
            </div>
            {userEmail && (
              <p className="text-sm text-neutral-400">{userEmail}</p>
            )}

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

        {/* Bio / texto explicativo */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-200">Sobre tu espacio</h2>
          <p className="text-sm text-neutral-300">
            Este es tu espacio personal en Ethiqia. Aquí verás tu bio, tus fotos
            publicadas y la reputación asociada a tu actividad. En la demo, se
            muestra tu última publicación y un Ethiqia Score aproximado.
          </p>
          <p className="text-xs text-neutral-500">
            En la versión completa, podrás editar tu biografía, cambiar tu foto
            de perfil, gestionar tus publicaciones y consultar historiales de
            reputación y verificaciones.
          </p>
        </section>

        {/* Tus publicaciones: botón + cuadrícula + destacada */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-neutral-200">
              Tus publicaciones
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(
                    'En la demo, la publicación se genera subiendo una imagen en /demo/live y se muestra en el feed y en tu perfil. En la versión completa, este botón abrirá el flujo de “Añadir publicación”.'
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

          {/* Cuadrícula tipo Instagram – siempre llena */}
          <div className="grid grid-cols-3 gap-[2px] bg-neutral-900 rounded-lg overflow-hidden">
            {gridImages.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={
                  index === 0 && demoPost
                    ? 'Tu publicación'
                    : `Publicación demo ${index + 1}`
                }
                className="w-full aspect-square object-cover"
              />
            ))}
          </div>

          {/* Publicación destacada debajo */}
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
                  Última publicación de demo
                </p>
                <p className="text-[13px] text-neutral-400">
                  Esta foto se ha generado desde tu perfil para enseñar Ethiqia a
                  inversores, Parque Científico y convocatorias públicas.
                </p>
                <p className="text-[12px] text-neutral-300">
                  <span className="font-semibold">Ethiqia Score:</span>{' '}
                  {demoPost.score}/100
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-3">
              Aún no tienes publicaciones. Sube una imagen desde la demo en tiempo
              real y se mostrará aquí.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
