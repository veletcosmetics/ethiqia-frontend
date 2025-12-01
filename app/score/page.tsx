'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ScoreEntry = {
  id: string;
  source: string;
  value: number;
  created_at: string;
  meta: any;
};

export default function ScorePage() {
  const router = useRouter();
  const [totalScore, setTotalScore] = useState<number>(0);
  const [history, setHistory] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScore = async () => {
      setLoading(true);
      setError(null);

      // 1) Usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const user = userData.user;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 2) Historial de puntos del usuario
        const { data, error } = await supabase
          .from('scores')
          .select('id, source, value, created_at, meta')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const entries = (data || []) as ScoreEntry[];
        setHistory(entries);

        // 3) Sumar puntos
        const total = entries.reduce((sum, entry) => sum + entry.value, 0);
        setTotalScore(total);
      } catch (err: any) {
        setError(err.message || 'Error cargando el score');
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [router]);

  const getScoreLabel = (score: number) => {
    if (score <= 0) return 'Sin reputación aún';
    if (score < 20) return 'Score inicial';
    if (score < 50) return 'Score en crecimiento';
    if (score < 100) return 'Score sólido';
    return 'Score de alta confianza';
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* Cabecera */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mi Ethiqia Score</h1>
          <button
            className="text-xs px-3 py-1 border rounded-xl hover:bg-gray-100"
            onClick={() => router.push('/feed')}
          >
            Volver al feed
          </button>
        </header>

        {/* Bloque principal de score */}
        <section className="border rounded-2xl p-4 bg-black text-white flex flex-col gap-3">
          <p className="text-sm text-gray-300">Score acumulado</p>

          {loading ? (
            <p className="text-lg font-semibold">Calculando...</p>
          ) : (
            <div className="flex items-end gap-4">
              <p className="text-5xl font-bold">{totalScore}</p>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Ethiqia Score
                </span>
                <span className="text-sm text-gray-200">
                  {getScoreLabel(totalScore)}
                </span>
              </div>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Aún no tienes eventos de reputación. Publica en el feed para empezar a generar Score.
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-2">
              Error: {error}
            </p>
          )}
        </section>

        {/* Historial de puntuaciones */}
        <section className="border rounded-2xl p-4 flex flex-col gap-3 bg-white">
          <h2 className="text-sm font-semibold">Historial de puntos</h2>

          {loading && <p className="text-sm text-gray-500">Cargando historial…</p>}

          {!loading && history.length === 0 && (
            <p className="text-sm text-gray-500">
              Todavía no hay movimientos en tu score.
            </p>
          )}

          {!loading && history.length > 0 && (
            <ul className="flex flex-col gap-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between text-sm border rounded-xl px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {entry.source === 'post' ? 'Publicación creada' : entry.source}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={
                      'text-sm font-semibold ' +
                      (entry.value >= 0 ? 'text-green-600' : 'text-red-600')
                    }
                  >
                    {entry.value > 0 ? `+${entry.value}` : entry.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
