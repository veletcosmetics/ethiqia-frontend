'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBase } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${getBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      router.push('/login');
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
        <h1 className="text-2xl font-semibold text-center">Crear cuenta</h1>
        <p className="text-sm text-neutral-400 text-center">
          Únete a Ethiqia para construir reputación transparente con IA.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            className="w-full rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Tu nombre"
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-500 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300">
            Inicia sesión aquí
          </a>
        </p>
      </form>
    </main>
  );
}
