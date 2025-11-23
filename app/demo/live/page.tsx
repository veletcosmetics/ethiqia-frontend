'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addNotification } from '@/lib/notifications';
import { getSession } from '@/lib/session';

type AnalysisResult = {
  authenticity: number;
  aiProbability: number;
  coherence: number;
  ethScore: number;
};

type DemoPost = {
  imageUrl: string;
  score: number;
  name?: string;
  createdAt?: number;
};

const STORAGE_KEY = 'ethiqia_demo_post';

function generateAnalysis(): AnalysisResult {
  const aiProbability = Math.round(Math.random() * 70) + 10; // 10–80 %
  const authenticity =
    100 - aiProbability + Math.round((Math.random() - 0.5) * 10);
  const coherence = 70 + Math.round(Math.random() * 25);

  const authSafe = Math.max(0, Math.min(100, authenticity));
  const cohSafe = Math.max(0, Math.min(100, coherence));
  const aiSafe = Math.max(0, Math.min(100, aiProbability));

  const ethScore = Math.round(
    0.5 * authSafe + 0.3 * cohSafe + 0.2 * (100 - aiSafe)
  );

  return {
    authenticity: authSafe,
    aiProbability: aiSafe,
    coherence: cohSafe,
    ethScore,
  };
}

export default function LiveDemoPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSaved, setLastSaved] = useState<DemoPost | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [session, setSessionState] = useState<any>(null);

  // Cargar sesión guardada (demo) y última publicación de localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = getSession();
    if (s) setSessionState(s);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as DemoPost;
        if (data.imageUrl) {
          setLastSaved(data);
        }
      } catch {
        // ignorar
      }
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Evitamos HEIC y formatos raros
    if (!file.type.startsWith('image/')) {
      alert('Sube solo archivos de imagen (jpg, png, webp...)');
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name || 'Imagen subida');
    setAnalysis(null);
    setBackendError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setImageSrc(result);

      // 1) Simular análisis IA
      const generated = generateAnalysis();
      setAnalysis(generated);
      setIsAnalyzing(false);

      // 2) Guardar en localStorage (demo)
      try {
        const demoPost: DemoPost = {
          imageUrl: result,
          score: generated.ethScore,
          name: file.name || 'Demo Ethiqia',
          createdAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPost));
        setLastSaved(demoPost);
      } catch {
        // ignoramos errores de almacenamiento
      }

      // 3) Guardar la publicación también en un "feed" local de la demo
      try {
        const rawFeed = localStorage.getItem('ethiqia_feed_posts');
        const parsed = rawFeed ? JSON.parse(rawFeed) : [];

        const newPost = {
          id: `p-${Date.now()}`,
          imageUrl: result,
          score: generated.ethScore,
          createdAt: Date.now(),
        };

        const updated = [newPost, ...parsed];
        localStorage.setItem('ethiqia_feed_posts', JSON.stringify(updated));
      } catch {
        // ignoramos errores
      }

      // 4) GUARDAR EN SUPABASE (SIN user_id, solo imagen + caption)
      try {
        const { error } = await supabase.from('posts').insert({
          image_url: result, // en esta demo guardamos el dataURL directamente
          caption: file.name || 'Imagen subida en la demo en vivo',
        });

        if (error) {
          console.error('Error al guardar en Supabase:', error);
          setBackendError(
            '⚠️ La imagen se ha analizado y se ve en la demo, pero hubo un error al guardar en el backend real.'
          );
        } else {
          console.log('✅ Post guardado en Supabase correctamente');
          setBackendError(null);
        }
      } catch (e) {
        console.error(e);
        setBackendError(
          '⚠️ La imagen se ha analizado y se ve en la demo, pero hubo un error al guardar en el backend real.'
        );
      }

      // 5) Notificación de score (demo)
      try {
        addNotification(
          'post-scored',
          `Tu publicación generó ${generated.ethScore} puntos de Ethiqia Score.`
        );
      } catch {
        // ignoramos errores de notificaciones
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-50">
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Demo en tiempo real
          </p>
          <h1 className="text-2xl font-semibold">
            Sube una foto y deja que Ethiqia la analice
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl">
            Esta demo muestra el flujo completo: subes una imagen, la IA simula
            el análisis, genera un Ethiqia Score y la publicación se guarda en
            tu perfil y en el feed real (Supabase) además de la demo local.
          </p>
        </header>

        {/* Subida de imagen */}
        <section className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                1. Sube una imagen de demo
              </h2>
              <p className="text-xs text-neutral-400">
                Usa una foto real (jpg, png, webp…). En esta versión demo el
                archivo se procesa en tu navegador y también se guarda en
                Supabase como si fuera una publicación real.
              </p>
            </div>
          </div>

          <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-6 text-center text-xs text-neutral-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-300">
            <span className="text-3xl">📷</span>
            <span>
              Haz clic para elegir una imagen
              <span className="block text-[11px] text-neutral-500 mt-1">
                (no usamos HEIC; mejor jpg/png/webp)
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {fileName && (
            <p className="text-[11px] text-neutral-500">
              Imagen seleccionada:{' '}
              <span className="text-neutral-300">{fileName}</span>
            </p>
          )}

          {backendError && (
            <p className="text-[11px] text-amber-400 mt-1">{backendError}</p>
          )}
        </section>

        {/* Vista previa + análisis */}
        {(imageSrc || analysis || isAnalyzing) && (
          <section className="grid gap-4 md:grid-cols-2">
            {/* Imagen */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                2. Vista previa
              </h2>
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Vista previa"
                    className="w-full max-h-[360px] object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
                    Aún no has subido ninguna imagen.
                  </div>
                )}
              </div>
            </div>

            {/* Resultados IA */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                3. Análisis IA (simulado para demo)
              </h2>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-sm space-y-3">
                {isAnalyzing && (
                  <p className="text-xs text-neutral-400">
                    Analizando la imagen con la IA de Ethiqia…
                  </p>
                )}

                {!isAnalyzing && analysis && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">
                        Autenticidad estimada
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.authenticity}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${analysis.authenticity}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-neutral-300">
                        Probabilidad de que sea IA
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.aiProbability}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${analysis.aiProbability}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-neutral-300">
                        Coherencia del contenido
                      </span>
                      <span className="font-semibold text-neutral-100">
                        {analysis.coherence}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${analysis.coherence}%` }}
                      />
                    </div>

                    <hr className="border-neutral-800 my-3" />

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Ethiqia Score</span>
                      <span className="text-xl font-semibold text-emerald-400">
                        {analysis.ethScore}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      En producción este score vendría de modelos entrenados.
                      Aquí es una simulación para enseñar el flujo completo.
                    </p>
                  </>
                )}

                {!isAnalyzing && !analysis && (
                  <p className="text-xs text-neutral-400">
                    Sube una imagen para ver cómo Ethiqia la analizaría.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Estado de integración */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
          <h2 className="text-sm font-semibold text-neutral-100">
            Qué está pasando por detrás en esta demo
          </h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              La imagen se analiza en tu navegador y se guarda como publicación
              demo en <code>localStorage</code>.
            </li>
            <li>
              También se guarda una entrada real en Supabase en la tabla{' '}
              <code>posts</code> (imagen + texto).
            </li>
            <li>
              Esa publicación aparecerá en tu bio y en el feed real si todo está
              conectado correctamente.
            </li>
          </ul>

          {lastSaved && (
            <p className="text-[11px] text-neutral-500 mt-2">
              Última demo local guardada:{' '}
              <span className="text-neutral-300">
                {lastSaved.name || 'Sin nombre'}
              </span>
              , Ethiqia Score:{' '}
              <span className="text-emerald-300">
                {lastSaved.score}/100
              </span>
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
