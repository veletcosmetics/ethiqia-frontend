'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Login correcto → al feed
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Entrar en Ethiqia</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="border rounded-xl px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="border rounded-xl px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="underline">
            Crear cuenta
          </a>
        </p>
      </div>
    </main>
  );
}
