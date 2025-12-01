'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugSupabase() {
  const [status, setStatus] = useState('Cargando...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .limit(1);

      if (error) {
        setError(error.message);
      } else {
        setStatus('Conexión correcta con Supabase ✔️');
      }
    };

    testConnection();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-4">Debug Supabase</h1>

      {error ? (
        <p className="text-red-600">❌ Error: {error}</p>
      ) : (
        <p className="text-green-600">{status}</p>
      )}
    </main>
  );
}
