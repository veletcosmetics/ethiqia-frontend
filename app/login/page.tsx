'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBase } from '../../lib/api';
import { saveSession } from '../../lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getBase()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardamos la sesión sencilla en localStorage
      saveSession({
        token: data.token,
        user: {
          id: data.user?.id,
          name: data.user?.name,
          email: data.user?.email,
        },
      });

      // Redirigimos al perfil
      router.push('/profile');
    } catch (err: any) {
      setError(err.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 bg-neutral-900/70 border border-neutral-800 rounded-xl px-6 py-8"
      >
        <h1 className="text-2xl font-semibold text-center">Iniciar sesión</h1>
        <p className="text-sm text-neutral-400 text-center">
          Accede a tu cuenta Ethiqia.
        </p>

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="tucorreo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Tu contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-500 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
            Crea tu cuenta aquí
          </Link>
        </p>
      </form>
    </main>
  );
}
