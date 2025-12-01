'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserEmail(data.user.email ?? null);
      } else {
        setCurrentUserEmail(null);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    if (!email || !password) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setStatus('Usuario registrado. Si tienes confirmación de email activa, revisa tu correo.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setStatus('Inicio de sesión correcto.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStatus('Sesión cerrada.');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 gap-6">
      <h1 className="text-2xl font-bold">Debug Auth – Supabase</h1>

      <div className="border rounded-xl p-4 w-full max-w-md flex flex-col gap-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Usuario actual:{' '}
            {currentUserEmail ? (
              <strong>{currentUserEmail}</strong>
            ) : (
              <span className="italic">no hay sesión</span>
            )}
          </span>
          {currentUserEmail && (
            <button
              onClick={handleLogout}
              className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
            >
              Cerrar sesión
            </button>
          )}
        </div>

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 border rounded px-2 py-1 ${
              mode === 'signup' ? 'bg-black text-white' : 'bg-white'
            }`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 border rounded px-2 py-1 ${
              mode === 'login' ? 'bg-black text-white' : 'bg-white'
            }`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <input
            type="email"
            placeholder="Email"
            className="border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="mt-1 bg-black text-white rounded px-3 py-2 text-sm font-medium"
          >
            {mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        {status && <p className="text-xs text-green-700 mt-1">{status}</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <p className="text-xs text-gray-500">
        Pantalla de pruebas solo para desarrollo. Luego lo integraremos en el login real.
      </p>
    </main>
  );
}
