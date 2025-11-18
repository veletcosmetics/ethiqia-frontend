'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionData } from '../../lib/session';
import { getSession, clearSession } from '../../lib/session';

// Score base en función del usuario (para que cada usuario tenga algo distinto)
function computeBaseScore(session: SessionData | null): number {
  if (!session?.user?.email) return 72;
  const base = 60 + (session.user.email.length % 25);
  return Math.min(90, Math.max(50, base));
}

// Score "según la imagen" (DEMO IA)
// NO es IA real: solo usamos tamaño de archivo para que parezca que analiza algo.
function computeImageScore(file: File): number {
  const size = file.size; // bytes
  const base = 55 + (size % 40); // 55–95 aprox.
  return Math.min(95, Math.max(50, base));
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [score, setScore] = useState<number>(75);
  const [scoreSource, setScoreSource] = useState<'base' | 'image'>('base');
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setScore(computeBaseScore(s));
    setScoreSource('base');
    setLoading(false);
  }, []);

  function handleLogout() {
    clearSession();
    setSession(null);
    router.push('/login');
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar la imagen en el momento
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);

    // Recalcular score "como si" analizáramos la imagen con IA
    const newScore = computeImageScore(file);
    setScore(newScore);
    setScoreSource('image');
    setLastAnalysis(
      `Score recalculado a partir de la imagen cargada (${Math.round(
        file.size / 1024
      )} KB).`
    );

    // 👉 GUARDAR PUBLICACIÓN DEMO PARA EL FEED (solo en esta sesión, localStorage)
    if (typeof window !== 'undefined') {
      const demoPost = {
        imageUrl: url,
        score: newScore,
        name: session?.user?.name ?? 'Tu perfil Ethiqia',
        createdAt: Date.now(),
      };
      localStorage.setItem('ethiqia_demo_post', JSON.stringify(demoPost));
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950 text-neutral-100">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!session || !session.token) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
        <h1 className="text-2xl font-semibold mb-2">Perfil</h1>
        <p className="text-neutral-400 mb-4">
          Inicia sesión para ver tu perfil.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
        >
          Ir a iniciar sesión
        </button>
      </main>
    );
  }

  const name = session.user?.name ?? 'Usuario Ethiqia';
  const email = session.user?.email ?? '—';

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950 text-neutral-100">
      <section className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/70 px-6 py-8 space-y-6">
        {/* Cabecera perfil */}
        <header className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Tu perfil Ethiqia</h1>
            <p className="text-sm text-neutral-300">{name}</p>
            <p className="text-xs text-neutral-400">{email}</p>
          </div>
        </header>

        {/* Score Ethiqia */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.2em]">
            Ethiqia Score
          </p>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-4xl font-semibold leading-none">{score}</p>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                {scoreSource === 'base'
                  ? 'Score base demo generado a partir de tu perfil. En producción vendrá de los algoritmos de IA de Ethiqia.'
                  : 'Score recalculado en función de la imagen cargada (análisis de imagen simulado para la demo).'}
              </p>
            </div>
          </div>
        </div>

        {/* Subida de imagen para la demo IA */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.2em]">
            Análisis de imagen (DEMO IA)
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="block w-full text-xs text-neutral-300
                       file:mr-3 file:rounded-md file:border file:border-neutral-700
                       file:bg-neutral-900 file:px-3 file:py-1.5
                       file:text-xs file:text-neutral-200
                       hover:file:border-neutral-500"
          />
          <p className="text-[11px] text-neutral-500">
            Al subir una foto, Ethiqia recalcula el score como si analizara la imagen con IA.
            En esta versión es un análisis SIMULADO para demostraciones.
          </p>

          {lastAnalysis && (
            <p className="mt-1 text-[11px] text-neutral-400">
              {lastAnalysis}
            </p>
          )}

          <div className="mt-2 rounded-md border border-neutral-800 bg-neutral-900/70 px-3 py-2">
            <p className="text-[11px] text-neutral-300 font-medium mb-1">
              ¿Cómo lo explicas en la demo?
            </p>
            <ul className="text-[11px] text-neutral-400 list-disc pl-4 space-y-1">
              <li>“Subimos una imagen del perfil.”</li>
              <li>
                “El sistema aplica un análisis basado en IA y ajusta el Ethiqia Score en tiempo real.”
              </li>
              <li>
                “En esta demo el cálculo está simulado, pero la experiencia es la misma que en producción.”
              </li>
            </ul>
          </div>
        </div>

        {/* Pie */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleLogout}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
          >
            Cerrar sesión
          </button>
          <p className="text-[11px] text-neutral-500">
            Vista pensada para demostraciones a inversores y convocatorias.
          </p>
        </div>
      </section>
    </main>
  );
}
