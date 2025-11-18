'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getBase, setToken } from '@/lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo crear la cuenta');
      }

      const data = await res.json();
      // Opcional: si el backend devuelve token al registrar, lo guardamos
      if (data.token) {
        setToken(data.token);
        window.location.href = '/feed';
      } else {
        // Si no devuelve token, lo mandamos a login
        window.location.href = '/login';
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950 text-neutral-50">
      <section className="w-full max-w-md space-y-6 px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-center">
          Crear cuenta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">Nombre</label>
            <input
              type="text"
              className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none border border-neutral-700 focus:border-emerald-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">Email</label>
            <input
              type="email"
              className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none border border-neutral-700 focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">Contraseña</label>
            <input
              type="password"
              className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none border border-neutral-700 focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded bg-emerald-400 text-neutral-950 font-medium py-2 text-sm hover:bg-emerald-300 transition disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
