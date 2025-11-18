'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionData } from '../../lib/session';
import { getSession, clearSession } from '../../lib/session';

function computeDemoScore(session: SessionData | null): number {
  if (!session?.user?.email) return 72;
  // Cálculo tonto pero determinista para la demo
  const base = 60 + (session.user.email.length % 35);
  return Math.min(95, Math.max(45, base));
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [score, setScore] = useState<number>(75);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setScore(computeDemoScore(s));
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
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
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
                Score generado de forma simulada para la demo. En producción vendrá de los
                algoritmos de IA de Ethiqia.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.2em]">
            Foto de perfil (demo)
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
            La imagen se mantiene solo en esta sesión del navegador. Para la demo es suficiente
            para enseñar el concepto de perfil con foto.
          </p>
        </div>

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
