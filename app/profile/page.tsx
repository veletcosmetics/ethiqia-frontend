'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionData } from '../../lib/session';
import { getSession, clearSession } from '../../lib/session';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setLoading(false);
  }, []);

  function handleLogout() {
    clearSession();
    setSession(null);
    router.push('/login');
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

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950 text-neutral-100">
      <section className="w-full max-w-lg bg-neutral-900/70 border border-neutral-800 rounded-xl px-6 py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Tu perfil Ethiqia</h1>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-neutral-300">Nombre: </span>
            {session.user?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium text-neutral-300">Email: </span>
            {session.user?.email ?? '—'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
