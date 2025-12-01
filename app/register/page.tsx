'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      // 1) Crear usuario en Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // 2) Obtener usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      if (!user) {
        // Si tienes confirmación de email activada, puede que aún no haya sesión
        setInfo(
          'Cuenta creada. Revisa tu email para confirmar la cuenta antes de poder entrar.'
        );
        setLoading(false);
        return;
      }

      // 3) Crear/actualizar perfil en nuestra tabla "profiles"
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            display_name: displayName || email.split('@')[0],
          },
          {
            onConflict: 'user_id',
          }
        );

      if (profileError) throw profileError;

      // 4) Todo OK → al feed
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Crear cuenta en Ethiqia</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nombre público</label>
            <input
              type="text"
              className="border rounded-xl px-3 py-2 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo quieres que te vean en el perfil"
            />
          </div>

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
          {info && <p className="text-xs text-blue-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-black text-white rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </main>
  );
}
